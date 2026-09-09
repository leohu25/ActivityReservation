#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import fs from "node:fs";
import { loadPlatformMigrationsFromDirectory } from "./loader";
import { PlatformMigrationRunner } from "./runner";

function autoLoadEnvironment(packageDir: string): void {
  const workspaceRoot = path.resolve(packageDir, "../..");
  const candidates = [
    path.join(workspaceRoot, ".env.local"),
    path.join(workspaceRoot, ".env"),
    path.join(packageDir, ".env.local"),
    path.join(packageDir, ".env"),
  ];

  for (const envFile of candidates) {
    if (!fs.existsSync(envFile)) continue;
    const content = fs.readFileSync(envFile, "utf-8");
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
  }
}

async function main(): Promise<void> {
  const packageDir = path.resolve(import.meta.dirname, "..");
  autoLoadEnvironment(packageDir);

  const command = process.argv[2] ?? "help";

  if (command === "help" || command === "--help" || command === "-h") {
    console.log(`
平台数据库迁移工具 (Platform Migration CLI)

用法:
  platform-migrate status               查看当前平台库迁移状态
  platform-migrate up                   执行所有待应用的平台迁移
  platform-migrate down                 回退上一版本的平台迁移
    `);
    return;
  }

  const controlUrl = process.env.CONTROL_DATABASE_URL;
  if (!controlUrl) {
    console.error("\x1b[31m错误: 缺少 CONTROL_DATABASE_URL 环境变量\x1b[0m");
    process.exit(1);
  }

  const migrationsDir = path.join(packageDir, "migrations");
  const migrations = loadPlatformMigrationsFromDirectory(migrationsDir);
  const runner = new PlatformMigrationRunner(controlUrl);

  try {
    switch (command) {
      case "status": {
        console.log(">>> 查询平台数据库 (saas_control) 迁移状态...");
        const status = await runner.getStatus(migrations);
        console.log(`• 当前版本: ${status.currentVersion ?? "无 (未初始化)"}`);
        console.log(`• 已应用迁移数: ${status.appliedMigrations.length}`);
        console.log(`• 待应用迁移数: ${status.pendingMigrations.length}`);
        if (status.pendingMigrations.length > 0) {
          console.log("\n待应用版本列表:");
          for (const m of status.pendingMigrations) {
            console.log(`  - [待应用] ${m.version}_${m.name}`);
          }
        } else {
          console.log("\x1b[32m✔ 平台数据库已是最新版本\x1b[0m");
        }
        break;
      }

      case "up": {
        console.log(">>> 开始执行平台数据库升级...");
        const res = await runner.up(migrations);
        if (res.appliedCount === 0) {
          console.log("\x1b[32m✔ 平台数据库无需升级，已是最新状态\x1b[0m");
        } else {
          console.log(
            `\x1b[32m✔ 成功应用 ${res.appliedCount} 个平台迁移:\x1b[0m`,
          );
          for (const v of res.appliedVersions) {
            console.log(`  • ${v}`);
          }
        }
        break;
      }

      case "down": {
        console.log(">>> 准备回退平台数据库上一版本...");
        const res = await runner.down(migrations);
        if (res.rolledBackVersion) {
          console.log(
            `\x1b[32m✔ 成功回退版本: ${res.rolledBackVersion}\x1b[0m`,
          );
        } else {
          console.log("\x1b[33m• 没有可回退的平台迁移记录\x1b[0m");
        }
        break;
      }

      default: {
        console.error(`未知命令: ${command}`);
        process.exit(1);
      }
    }
  } catch (err: unknown) {
    console.error(
      "\x1b[31m执行失败:\x1b[0m",
      err instanceof Error ? err.message : String(err),
    );
    process.exit(1);
  }
}

main();
