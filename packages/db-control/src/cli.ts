#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

/**
 * 安全解析并载入 env 文件（优先使用原生 loadEnvFile）
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
 * 加载环境变量：
 * 优先使用外部注入的 process.env；
 * 若未提供，按顺序检查当前 package、管控端应用 (apps/control) 或租户端应用 (apps/tenant) 的本地配置。
 */
function autoLoadEnvironment(packageDir: string): void {
  // 若环境已通过外部注入（如命令行或 CI），直接返回
  if (process.env.CONTROL_DATABASE_URL) return;

  const workspaceRoot = path.resolve(packageDir, "../..");
  // 遵循应用级隔离原则：优先在对应 App 查找配置
  const candidates = [
    path.join(packageDir, ".env.local"),
    path.join(packageDir, ".env"),
    path.join(workspaceRoot, "apps/control/.env.local"),
    path.join(workspaceRoot, "apps/control/.env"),
    path.join(workspaceRoot, "apps/tenant/.env.local"),
    path.join(workspaceRoot, "apps/tenant/.env"),
  ];

  for (const file of candidates) {
    if (loadEnvFileSafe(file) && process.env.CONTROL_DATABASE_URL) {
      break;
    }
  }
}

function printHelp(): void {
  console.log(`
平台总控数据库 (Control DB) 管理与迁移 CLI

用法:
  pnpm run db:control:<command> 或 tsx src/cli.ts <command> [options]

核心命令:
  diff                        扫描比对当前总控物理库与 schema.prisma 的结构差异 (支持自动检测未同步字段)
  diff:sql                    扫描比对并将变更差异直接渲染为可执行的 SQL 补丁预览
  generate                    依据 schema.prisma 重新生成 @prisma/client 强类型代码
  help                        显示此帮助信息
`);
}

async function main(): Promise<void> {
  const packageDir = path.resolve(import.meta.dirname, "..");
  const workspaceRoot = path.resolve(packageDir, "../..");
  autoLoadEnvironment(packageDir);

  const command = process.argv[2] ?? "help";

  if (command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  const controlUrl = process.env.CONTROL_DATABASE_URL;
  if (!controlUrl && command !== "generate") {
    console.error(
      "\x1b[31m错误: 缺少 CONTROL_DATABASE_URL 环境变量，无法连接 Control DB。\x1b[0m\n" +
        "请确保在 apps/control/.env.local 或 apps/tenant/.env.local 中配置了有效的 CONTROL_DATABASE_URL，或通过环境变量直接注入。",
    );
    process.exit(1);
  }

  const candidateBins = [
    path.join(packageDir, "node_modules/.bin/prisma"),
    path.join(workspaceRoot, "node_modules/.bin/prisma"),
  ];
  const prismaBin =
    candidateBins.find((bin) => fs.existsSync(bin)) ??
    path.join(packageDir, "node_modules/.bin/prisma");
  const configPath = path.join(packageDir, "prisma.config.ts");
  const schemaPath = path.join(packageDir, "prisma/schema.prisma");

  try {
    switch (command) {
      case "diff": {
        console.log(
          ">>> 正在扫描比对 Control 物理库与 schema.prisma 的结构差异...",
        );
        const output = execFileSync(
          prismaBin,
          [
            "migrate",
            "diff",
            "--config",
            configPath,
            "--from-config-datasource",
            "--to-schema",
            schemaPath,
          ],
          {
            env: process.env,
            encoding: "utf-8",
          },
        );

        if (output.includes("No difference detected")) {
          console.log(
            "\x1b[32m✔ 物理库与 Schema 完全同步，未发现任何结构漂移或新增字段。\x1b[0m",
          );
        } else {
          console.log(
            "\x1b[33m• 检测到以下结构变更 (物理库 -> Schema 差异):\x1b[0m",
          );
          console.log(output);
          console.log(
            "\x1b[36m提示: 生产或开发环境均请前往平台管控后台 (/migrations) 或运行 migration 流程完成安全升级，可执行 `pnpm run db:control:diff:sql` 查看 DDL 详情。\x1b[0m",
          );
        }
        break;
      }

      case "diff:sql": {
        console.log(
          ">>> 正在生成 Control DB 物理库对齐至 schema.prisma 所需的 SQL 补丁...",
        );
        const sqlOutput = execFileSync(
          prismaBin,
          [
            "migrate",
            "diff",
            "--config",
            configPath,
            "--from-config-datasource",
            "--to-schema",
            schemaPath,
            "--script",
          ],
          {
            env: process.env,
            encoding: "utf-8",
          },
        );

        if (
          !sqlOutput.trim() ||
          sqlOutput.includes("-- This is an empty migration")
        ) {
          console.log("\x1b[32m✔ 物理库已是最新状态，所需 SQL 为空。\x1b[0m");
        } else {
          console.log("\x1b[32m✔ 生成增量 SQL 补丁预览如下:\x1b[0m\n");
          console.log(sqlOutput);
        }
        break;
      }

      case "generate": {
        console.log(
          ">>> 正在重新生成 Control DB 的 Prisma Client 客户端代码...",
        );
        execFileSync(prismaBin, ["generate", "--config", configPath], {
          env: process.env,
          stdio: "inherit",
        });
        console.log("\x1b[32m✔ Prisma Client 生成完毕！\x1b[0m");
        break;
      }

      case "status": {
        console.log(">>> 检查 Control DB 连通性与 Schema 对齐状态...");
        const diffCheck = execFileSync(
          prismaBin,
          [
            "migrate",
            "diff",
            "--config",
            configPath,
            "--from-config-datasource",
            "--to-schema",
            schemaPath,
          ],
          {
            env: process.env,
            encoding: "utf-8",
          },
        );

        if (diffCheck.includes("No difference detected")) {
          console.log(
            "\x1b[32m✔ Control DB 状态健康：物理库与当前 schema.prisma 100% 吻合。\x1b[0m",
          );
        } else {
          console.log(
            "\x1b[31m✗ 警告：Control 物理库与 schema.prisma 存在差异，请执行同步！\x1b[0m",
          );
          console.log(diffCheck);
          process.exit(1);
        }
        break;
      }

      default: {
        console.error(`未知命令: ${command}`);
        printHelp();
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

void main();
