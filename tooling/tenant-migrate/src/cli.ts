#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  createControlPrismaClient,
  PrismaControlDbRepository,
} from "@chenrun/db-control";
import {
  TenantMigrationRunner,
  TenantProvisioner,
  createDefaultPgSqlExecutorFactory,
  type SecretResolver,
} from "@chenrun/db-tenant";
import { loadMigrationsFromDirectory } from "./loader";
import { generateMigrationFromSchema } from "./generator";

/**
 * 解析命令行简单参数键值对
 */
function parseArgs(args: readonly string[]): {
  command: string;
  positionals: string[];
  options: Record<string, string | boolean>;
} {
  const positionals: string[] = [];
  const options: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        options[key] = next;
        i++;
      } else {
        options[key] = true;
      }
    } else {
      positionals.push(arg);
    }
  }

  return {
    command: positionals[0] ?? "help",
    positionals: positionals.slice(1),
    options,
  };
}

/**
 * 打印帮助指南说明
 */
function printHelp(): void {
  console.log(`
多租户数据库迁移引擎命令行工具 (Tenant DB Migration CLI)

用法:
  tenant-migrate <command> [options]

核心命令:
  generate <name>                     自动扫描 Prisma 实体变动并生成带时间戳的 SQL 迁移文件 (类似 alembic revision --autogenerate)
  up [--all | --tenant <orgId>]       对所有活跃租户或指定单租户执行尚未应用的增量迁移
  status [--tenant <orgId>]           查看单租户或所有租户的当前 Schema 版本与迁移账本历史
  retry --tenant <orgId>              对处于 FAILED 失败状态的租户重试最新失败的迁移
  rollback --tenant <orgId> --target <version>
                                      对指定租户物理库执行降级回滚至目标版本 (需提供 down 脚本)
  provision --tenant <orgId> [--cluster <code?>] [--admin-url <url?>]
                                      自动化开通新租户独立物理数据库并执行基线初始化迁移

选项参数:
  --all                               应用于所有活跃租户
  --tenant <orgId>                    指定单一租户组织 ID
  --target <version>                  指定目标升级/回滚版本号
  --help                              显示本帮助文档
`);
}

/**
 * 安全解析并载入 env 文件（不覆盖已存在的 process.env，优先使用原生 loadEnvFile）
 */
function loadEnvFileSafe(filePath: string): boolean {
  try {
    if (!fs.existsSync(filePath)) return false;
    if (typeof process.loadEnvFile === "function") {
      process.loadEnvFile(filePath);
      return true;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (process.env[key] === undefined) {
          process.env[key] = val;
        }
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * 自动向上扫描并加载环境变量配置文件
 */
function autoLoadEnvironment(
  workspaceRoot: string,
  packageDir: string,
): string[] {
  const candidates = [
    path.join(workspaceRoot, ".env.local"),
    path.join(workspaceRoot, ".env"),
    path.join(packageDir, ".env.local"),
    path.join(packageDir, ".env"),
    path.join(workspaceRoot, "apps/tenant/.env.local"),
    path.join(workspaceRoot, "apps/control/.env.local"),
  ];

  const loadedFiles: string[] = [];
  for (const file of candidates) {
    if (loadEnvFileSafe(file)) {
      loadedFiles.push(file);
    }
  }
  return loadedFiles;
}

/**
 * 默认环境变量与 Secret 解析器 (遵循项目安全隔离规范)
 */
class DefaultEnvSecretResolver implements SecretResolver {
  async resolveDatabaseUrl(secretRef: string): Promise<string> {
    const envVar = secretRef.replace(/[^a-zA-Z0-9_]/g, "_").toUpperCase();
    const resolved = process.env[envVar] ?? process.env.TENANT_DATABASE_URL;
    if (resolved && resolved.trim().length > 0) {
      return resolved;
    }
    // 降级兜底：从 CONTROL_DATABASE_URL 提取主机端口替换为指定物理库
    const controlUrl = process.env.CONTROL_DATABASE_URL;
    if (controlUrl) {
      try {
        const parsed = new URL(controlUrl);
        parsed.pathname = `/${secretRef}`;
        return parsed.toString();
      } catch {
        // 忽略解析错误
      }
    }
    return `postgresql://postgres:postgres@localhost:5432/${secretRef}?schema=public`;
  }
}

/**
 * CLI 核心入口调度器
 */
async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const { command, positionals, options } = parseArgs(argv);

  const cliDir = import.meta.dirname;
  const packageDir = path.resolve(cliDir, "..");
  const workspaceRoot = path.resolve(packageDir, "../..");
  const defaultMigrationsDir = path.join(packageDir, "migrations");
  const defaultSchemaPath = path.join(
    workspaceRoot,
    "packages/db-tenant/prisma/schema.prisma",
  );

  // 自动从当前目录及工作区根目录检索并加载 .env 与 .env.local
  const loadedEnvFiles = autoLoadEnvironment(workspaceRoot, packageDir);

  // 1. generate 实体扫描自动生成命令 (开发期/CI 无需连接数据库)
  if (command === "generate") {
    const migrationName = positionals[0] ?? (options.name as string);
    if (!migrationName) {
      console.error(
        "错误: 必须指定迁移名称，例如: tenant-migrate generate add_tax_rate",
      );
      process.exit(1);
    }

    console.log(
      `>>> 正在扫描 Prisma 实体并计算增量 Diff: [${migrationName}]...`,
    );
    const result = generateMigrationFromSchema({
      name: migrationName,
      schemaPath: defaultSchemaPath,
      migrationsDir: defaultMigrationsDir,
    });

    if (result.isEmpty) {
      console.log(
        `\x1b[33m• 未检测到任何实体模型变更，已生成空脚手架: ${result.folderName}\x1b[0m`,
      );
    } else {
      console.log(
        `\x1b[32m✔ 成功生成版本迁移脚本: ${result.folderName}\x1b[0m`,
      );
      console.log(`• 文件路径: ${result.sqlFilePath}`);
      console.log(
        "• SQL 预览:\n" +
          result.diffSql.split("\n").slice(0, 10).join("\n") +
          "\n...",
      );
    }
    return;
  }

  if (command === "help" || options.help) {
    printHelp();
    return;
  }

  // 以下命令需要 Control DB 上下文
  const controlDbUrl = process.env.CONTROL_DATABASE_URL;
  if (!controlDbUrl) {
    console.error(
      "错误: 缺少 CONTROL_DATABASE_URL 环境变量，无法连接 Control DB 账本。\n" +
        "已扫描以下环境配置文件，未发现有效的 CONTROL_DATABASE_URL:\n" +
        (loadedEnvFiles.length > 0
          ? loadedEnvFiles.map((f) => `  • ${f}`).join("\n")
          : "  • (未找到任何 .env 或 .env.local 配置文件)") +
        "\n\n" +
        "请在项目根目录创建或补充 .env.local 文件:\n" +
        '  CONTROL_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chenrun_control?schema=public"\n',
    );
    process.exit(1);
  }

  const prismaClient = createControlPrismaClient(controlDbUrl);
  const repo = new PrismaControlDbRepository(prismaClient);
  const secretResolver = new DefaultEnvSecretResolver();
  const executorFactory = createDefaultPgSqlExecutorFactory();
  const migrations = loadMigrationsFromDirectory(defaultMigrationsDir);

  const runner = new TenantMigrationRunner(
    repo,
    secretResolver,
    executorFactory,
    migrations,
  );

  try {
    switch (command) {
      case "up": {
        const tenantId = options.tenant as string | undefined;
        let isAll = Boolean(options.all);
        const targetVersion = options.target as string | undefined;

        // 如果用户既未指定 --tenant 也未指定 --all，则默认执行全量活跃租户批量升级
        if (!tenantId && !isAll) {
          console.log(
            "提示: 未指定 --tenant <orgId>，默认对所有活跃租户执行升级 (等同于 --all)",
          );
          isAll = true;
        }

        if (tenantId) {
          console.log(`>>> 正在针对单租户 [${tenantId}] 执行迁移升级...`);
          const results = await runner.migrateTenant(tenantId, {
            targetVersion,
          });
          if (results.length === 0) {
            console.log(
              `\x1b[32m✔ 租户 [${tenantId}] 数据库已是最新版本，无需升级。\x1b[0m`,
            );
          } else {
            console.log(
              `\x1b[32m✔ 租户 [${tenantId}] 成功升级 ${results.length} 个版本:\x1b[0m`,
            );
            for (const r of results) {
              console.log(
                `  • 版本: ${r.version} (${r.migrationName}) 耗时: ${r.durationMs}ms`,
              );
            }
          }
        } else if (isAll) {
          console.log(">>> 正在遍历所有活跃租户执行批量迁移升级...");
          const batch = await runner.migrateAllTenants({ targetVersion });
          console.log(
            `\x1b[32m✔ 批量迁移完成 (批次 ID: ${batch.batchId}):\x1b[0m`,
          );
          console.log(`  • 扫描租户: ${batch.totalTenants}`);
          console.log(`  • 成功升级: ${batch.successCount}`);
          console.log(`  • 无需升级: ${batch.upToDateCount}`);
          console.log(`  • 升级失败: ${batch.failureCount}`);
          if (batch.failureCount > 0) {
            process.exit(1);
          }
        } else {
          console.error(
            "错误: 请通过 --tenant <orgId> 指定单租户或通过 --all 执行全租户升级",
          );
          process.exit(1);
        }
        break;
      }

      case "status": {
        const tenantId = options.tenant as string | undefined;
        if (tenantId) {
          console.log(`>>> 正在查询租户 [${tenantId}] 版本状态与账本历史...`);
          const report = await runner.getTenantStatus(tenantId);
          console.log(`• 租户 ID     : ${report.organizationId}`);
          console.log(`• 数据库名称  : ${report.databaseName}`);
          console.log(`• 当前版本    : ${report.currentVersion}`);
          console.log(`• 物理库状态  : ${report.databaseStatus}`);
          console.log(`• 待升级版本数: ${report.pendingMigrationCount}`);
          if (report.pendingMigrations.length > 0) {
            console.log("• 待升级版本清单:");
            for (const p of report.pendingMigrations) {
              console.log(`    - ${p.version} (${p.name})`);
            }
          }
          if (report.history.length > 0) {
            console.log("• 最近迁移记录账本:");
            console.table(
              report.history.map((h) => ({
                ID: h.id,
                版本: h.version,
                名称: h.migrationName,
                状态: h.status,
                耗时ms: h.executionTimeMs,
                错误: h.errorMessage ?? "无",
              })),
            );
          }
        } else {
          const allDbs = await repo.listTenantDatabases();
          console.log(`>>> 全局租户物理库概况 (共 ${allDbs.length} 个租户):`);
          console.table(
            allDbs.map((d) => ({
              组织ID: d.organizationId,
              物理库: d.databaseName,
              当前版本: d.schemaVersion,
              状态: d.status,
            })),
          );
        }
        break;
      }

      case "retry": {
        const tenantId = options.tenant as string | undefined;
        if (!tenantId) {
          console.error(
            "错误: retry 命令必须通过 --tenant <orgId> 指定租户 ID",
          );
          process.exit(1);
        }
        console.log(`>>> 正在重试租户 [${tenantId}] 最新失败迁移...`);
        const results = await runner.retryFailedMigration(tenantId);
        console.log(
          `\x1b[32m✔ 重试成功！已应用 ${results.length} 个版本。\x1b[0m`,
        );
        break;
      }

      case "rollback": {
        const tenantId = options.tenant as string | undefined;
        const targetVersion = options.target as string | undefined;
        if (!tenantId || !targetVersion) {
          console.error(
            "错误: rollback 必须同时指定 --tenant <orgId> 和 --target <version>",
          );
          process.exit(1);
        }
        console.log(
          `>>> 正在将租户 [${tenantId}] 降级回滚至版本 [${targetVersion}]...`,
        );
        const results = await runner.rollbackTenant(tenantId, targetVersion);
        console.log(
          `\x1b[32m✔ 成功回滚 ${results.length} 个版本至 [${targetVersion}]。\x1b[0m`,
        );
        break;
      }

      case "provision": {
        const tenantId = options.tenant as string | undefined;
        if (!tenantId) {
          console.error("错误: provision 必须指定 --tenant <orgId>");
          process.exit(1);
        }
        const clusterCode = (options.cluster as string) ?? "cluster_primary";
        const adminUrl =
          (options["admin-url"] as string) ??
          process.env.CONTROL_DATABASE_URL ??
          "postgresql://postgres:postgres@localhost:5432/postgres";

        const provisioner = new TenantProvisioner(
          repo,
          executorFactory,
          runner,
        );

        console.log(`>>> 正在为租户 [${tenantId}] 自动化开通独立物理数据库...`);
        const provisionResult = await provisioner.provisionTenantDatabase({
          organizationId: tenantId,
          clusterCode,
          adminDatabaseUrl: adminUrl,
          secretRef: `tenant_${tenantId}`,
        });

        console.log(`\x1b[32m✔ 租户数据库开通成功！\x1b[0m`);
        console.log(`  • 物理数据库: ${provisionResult.databaseName}`);
        console.log(`  • 初始版本  : ${provisionResult.schemaVersion}`);
        console.log(`  • 库状态    : ${provisionResult.status}`);
        console.log(
          `  • 应用迁移  : ${provisionResult.appliedMigrationCount} 个`,
        );
        break;
      }

      default: {
        console.error(`未知命令: ${command}`);
        printHelp();
        process.exit(1);
      }
    }
  } finally {
    await prismaClient.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error("执行异常:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
