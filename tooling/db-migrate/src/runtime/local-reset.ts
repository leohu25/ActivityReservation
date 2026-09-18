import readline from "node:readline";
import pg from "pg";
import { getMigrationCatalog } from "./catalog";

export interface ResetTenantOptions {
	readonly databaseName?: string;
	readonly force?: boolean;
}

function getAdminDatabaseUrl(connectionString: string): string {
	try {
		const parsed = new URL(connectionString);
		parsed.pathname = "/postgres";
		return parsed.toString();
	} catch {
		throw new Error(`Invalid database connection string: ${connectionString}`);
	}
}

function getTenantDatabaseUrl(
	baseConnectionString: string,
	databaseName: string,
): string {
	try {
		const parsed = new URL(baseConnectionString);
		parsed.pathname = `/${databaseName}`;
		return parsed.toString();
	} catch {
		throw new Error(
			`Invalid base database connection string: ${baseConnectionString}`,
		);
	}
}

async function askConfirmation(prompt: string): Promise<boolean> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve) => {
		rl.question(prompt, (answer) => {
			rl.close();
			const trimmed = answer.trim().toLowerCase();
			resolve(trimmed === "yes" || trimmed === "y");
		});
	});
}

export async function resetLocalTenantDatabases(
	controlDatabaseUrl: string,
	options: ResetTenantOptions = {},
): Promise<void> {
	// 生产环境保护：如果不是本地连接，严禁直接执行重置
	let parsedUrl: URL;
	try {
		parsedUrl = new URL(controlDatabaseUrl);
	} catch {
		throw new Error(`Invalid CONTROL_DATABASE_URL: ${controlDatabaseUrl}`);
	}
	const isLocalhost =
		parsedUrl.hostname === "127.0.0.1" ||
		parsedUrl.hostname === "localhost" ||
		parsedUrl.hostname === "0.0.0.0";
	if (!isLocalhost && !options.force) {
		throw new Error(
			`[安全拦截] 目标数据库主机为 "${parsedUrl.hostname}"，非本地环境 (127.0.0.1/localhost)！重置租户库属于高危破坏性操作，已严格阻断。`,
		);
	}

	const catalog = getMigrationCatalog("tenant");
	const adminUrl = getAdminDatabaseUrl(controlDatabaseUrl);

	const controlClient = new pg.Client({ connectionString: controlDatabaseUrl });
	let targets: {
		databaseName: string;
		organizationId?: string;
		orgName?: string;
		memberId?: string;
		userId?: string;
		userName?: string;
		userEmail?: string;
	}[] = [];

	try {
		await controlClient.connect();
		const query = `
      SELECT 
        td.database_name as "databaseName",
        td.organization_id as "organizationId",
        o.name as "orgName",
        m.id as "memberId",
        m.user_id as "userId",
        u.name as "userName",
        u.email as "userEmail"
      FROM tenant_database td
      LEFT JOIN organization o ON o.id = td.organization_id
      LEFT JOIN member m ON m.organization_id = td.organization_id AND m.role = 'owner'
      LEFT JOIN "user" u ON u.id = m.user_id
      ${options.databaseName ? "WHERE td.database_name = $1" : ""}
    `;
		const params = options.databaseName ? [options.databaseName] : [];
		const res = await controlClient.query(query, params);
		targets = res.rows;
	} catch (err: unknown) {
		console.warn(
			`\x1b[33m⚠ 读取 Control DB 租户映射失败 (${err instanceof Error ? err.message : String(err)})，回退至默认本地租户。\x1b[0m`,
		);
	}

	if (targets.length === 0) {
		targets = [
			{
				databaseName: options.databaseName || "tenant_001",
				orgName: "本地测试企业",
			},
		];
	}

	const targetNames = targets.map((t) => t.databaseName).join(", ");
	console.log(`
\x1b[41m\x1b[37m 危险操作警告 (HIGH RISK WARNING) \x1b[0m
\x1b[31m即将清空并销毁以下租户物理数据库中的全部存量业务数据：\x1b[0m
  • 目标物理库: \x1b[33m${targetNames}\x1b[0m
  • 目标主机:   \x1b[33m${parsedUrl.host}\x1b[0m
  • 目标版本:   \x1b[33m${catalog.baseline.version}\x1b[0m
\x1b[31m此操作不可逆！库内所有存量订单、客户与业务明细将被永久抹除并重新灌装种子数据。\x1b[0m
`);

	if (!options.force) {
		const confirmed = await askConfirmation(
			"确定要清空并重建上述租户数据库吗？输入 [yes/y] 确认继续，输入其他任意键取消: ",
		);
		if (!confirmed) {
			console.log(
				"\n\x1b[33m操作已由人工主动取消，数据库未做任何更改。\x1b[0m\n",
			);
			return;
		}
	}

	console.log(
		`\n\x1b[34m>>> 已通过人工确认，开始重置本地租户数据库 (共 ${targets.length} 个目标)\x1b[0m`,
	);

	const adminClient = new pg.Client({ connectionString: adminUrl });
	await adminClient.connect();

	try {
		for (const target of targets) {
			const dbName = target.databaseName;
			console.log(`\n  • 正在清空并重建物理库: \x1b[36m${dbName}\x1b[0m ...`);

			// 终止已有长连接
			await adminClient.query(
				`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
				[dbName],
			);
			await adminClient.query(
				`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`,
			);
			await adminClient.query(`CREATE DATABASE "${dbName}"`);

			// 连接新库并灌装最新基线
			const tenantUrl = getTenantDatabaseUrl(controlDatabaseUrl, dbName);
			const tenantClient = new pg.Client({ connectionString: tenantUrl });
			await tenantClient.connect();

			try {
				console.log(
					`    └─ 灌装 Baseline DDL (版本: ${catalog.baseline.version}) ...`,
				);
				await tenantClient.query(catalog.baseline.sql);

				// 登记基线迁移账本
				await tenantClient.query(`
          CREATE TABLE IF NOT EXISTS "tenant_schema_migration" (
            "version" VARCHAR(30) PRIMARY KEY,
            "checksum" VARCHAR(64) NOT NULL,
            "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
				await tenantClient.query(
					`INSERT INTO "tenant_schema_migration" ("version", "checksum", "applied_at") VALUES ($1, $2, NOW())`,
					[catalog.baseline.version, catalog.baseline.checksum],
				);

				// 逐个执行后续增量迁移
				for (const migration of catalog.migrations) {
					console.log(
						`    └─ 应用增量迁移: ${migration.version}_${migration.name} ...`,
					);
					await tenantClient.query(migration.upSql);
					await tenantClient.query(
						`INSERT INTO "tenant_schema_migration" ("version", "checksum", "applied_at") VALUES ($1, $2, NOW())`,
						[migration.version, migration.checksum],
					);
				}

				// 注入默认组织人事种子数据
				console.log(`    └─ 注入默认部门与岗位种子数据 ...`);
				await tenantClient.query(
					`
          INSERT INTO department (id, name, code, sort, status, created_at, updated_at)
          VALUES ('dept_root', $1, 'ROOT', 0, 'ACTIVE', NOW(), NOW());
        `,
					[target.orgName || "净菜加工"],
				);

				await tenantClient.query(`
          INSERT INTO position (id, name, code, description, sort, status, created_at, updated_at)
          VALUES 
            ('pos_gm', '总经理', 'pos_gm', '企业最高管理负责人', 1, 'ACTIVE', NOW(), NOW()),
            ('pos_supervisor', '部门主管', 'pos_supervisor', '部门业务管理负责人', 10, 'ACTIVE', NOW(), NOW()),
            ('pos_specialist', '业务专员', 'pos_specialist', '基层核心业务经办人员', 20, 'ACTIVE', NOW(), NOW());
        `);

				if (target.memberId && target.userId) {
					console.log(
						`    └─ 恢复 Owner 员工档案 (${target.userName || target.userEmail}) ...`,
					);
					const empId = `emp_${target.organizationId || "default"}_owner`;
					await tenantClient.query(
						`
            INSERT INTO employee_profile (
              id, member_id, user_id, employee_no, department_id, position_id, 
              name_snapshot, email_snapshot, job_title, status, joined_at, created_at, updated_at
            )
            VALUES ($1, $2, $3, 'E0001', 'dept_root', 'pos_gm', $4, $5, '企业所有者', 'ACTIVE', NOW(), NOW(), NOW());
          `,
						[
							empId,
							target.memberId,
							target.userId,
							target.userName || "管理员",
							target.userEmail || "admin@example.com",
						],
					);
				}

				console.log(
					`    \x1b[32m✔ 租户物理库 ${dbName} 重置并初始化完毕\x1b[0m`,
				);
			} finally {
				await tenantClient.end();
			}

			// 同步 Control DB 拓扑版本
			const latestVersion =
				catalog.migrations.at(-1)?.version ?? catalog.baseline.version;
			try {
				await controlClient.query(
					`
          UPDATE tenant_database 
          SET schema_version = $1, status = 'ACTIVE', updated_at = NOW() 
          WHERE database_name = $2
        `,
					[latestVersion, dbName],
				);
			} catch {
				// Control DB 更新失败不阻断整体流程
			}
		}
	} finally {
		await adminClient.end();
		await controlClient.end().catch(() => {});
	}

	console.log(
		`\n\x1b[32m✔ 全部本地租户数据库已重置至最新 Baseline (${catalog.baseline.version})\x1b[0m\n`,
	);
}
