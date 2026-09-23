#!/usr/bin/env node

/**
 * 生产 BOM 闭环演示种子数据装载工具 (Seed BOM Demo Data)
 * 用途：为当前已存在的活跃租户物理数据库注入 BOM 及关联实体（字典、单位、品类、商品、产线、工序、3类BOM）
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findWorkspaceRoot(startDir = __dirname) {
	let curr = path.resolve(startDir);
	while (curr !== path.dirname(curr)) {
		if (fs.existsSync(path.join(curr, "pnpm-workspace.yaml"))) {
			return curr;
		}
		curr = path.dirname(curr);
	}
	return path.resolve(startDir, "../..");
}

const workspaceRoot = findWorkspaceRoot();
const require = createRequire(import.meta.url);
const { Client } = require(path.join(workspaceRoot, "packages/base/db-tenant/node_modules/pg"));

const BOM_DEMO_SEED_SQL = fs.readFileSync(
	path.join(workspaceRoot, "packages/runtime/db/seeds/bom-demo-seed.sql"),
	"utf-8",
);

// 读取 Control DB 与租户数据库配置
const candidateEnvFiles = [
	path.join(workspaceRoot, "apps/tenant/.env.local"),
	path.join(workspaceRoot, "apps/control/.env.local"),
	path.join(workspaceRoot, ".env.local"),
	path.join(workspaceRoot, ".env"),
];

for (const envFile of candidateEnvFiles) {
	if (fs.existsSync(envFile) && "loadEnvFile" in process) {
		try {
			process.loadEnvFile(envFile);
		} catch {}
	}
}

async function main() {
	console.log("\x1b[34m>>> 装载生产 BOM 闭环演示数据 (Inject BOM Demo Seed)\x1b[0m\n");

	const controlDbUrl = process.env.CONTROL_DATABASE_URL;
	if (!controlDbUrl) {
		console.error("\x1b[31m错误: 未在环境中找到 CONTROL_DATABASE_URL 配置\x1b[0m");
		process.exit(1);
	}

	const controlClient = new Client({ connectionString: controlDbUrl });
	await controlClient.connect();

	try {
		// 查询当前 Control DB 中所有活跃的租户物理库
		const res = await controlClient.query(`
			SELECT id, organization_id, database_name 
			FROM tenant_database 
			WHERE status = 'ACTIVE'
		`);

		if (res.rows.length === 0) {
			console.log("\x1b[33m提示: 当前未发现活跃的租户物理数据库，请先通过系统登录/开通租户或执行 pnpm db:tenant:reset\x1b[0m");
			process.exit(0);
		}

		for (const row of res.rows) {
			const { database_name } = row;
			console.log(`• 正在为租户数据库 [\x1b[36m${database_name}\x1b[0m] 注入全链路演示数据...`);

			const urlObj = new URL(controlDbUrl);
			urlObj.pathname = `/${database_name}`;

			const tenantClient = new Client({ connectionString: urlObj.toString() });
			await tenantClient.connect();

			try {
				await tenantClient.query(BOM_DEMO_SEED_SQL);
				console.log(`  \x1b[32m✔ 成功注入 BOM 闭环演示数据！\x1b[0m`);
			} catch (err) {
				console.error(
					`  \x1b[31m✗ 注入失败:\x1b[0m`,
					err instanceof Error ? err.message : String(err),
				);
			} finally {
				await tenantClient.end();
			}
		}

		console.log("\n\x1b[32m✔ 全部租户演示数据装载完成！可直接在前端刷新 /production/bom 查看效果。\x1b[0m");
	} finally {
		await controlClient.end();
	}
}

main().catch((err) => {
	console.error("执行异常:", err);
	process.exit(1);
});
