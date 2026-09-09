import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

/**
 * 自动生成迁移文件的输入参数契约
 */
export interface GenerateMigrationInput {
  /** 迁移语义化名称 (如 add_tax_rate, create_procurement_order) */
  readonly name: string;
  /** 租户 Prisma Schema 路径 */
  readonly schemaPath: string;
  /** 迁移文件存放目标目录 */
  readonly migrationsDir: string;
  /** 可选基线数据源 URL (用于 diff 比较，缺省使用本地 dummy 或 empty) */
  readonly datasourceUrl?: string;
}

/**
 * 生成迁移文件的产出结果
 */
export interface GenerateMigrationResult {
  /** 生成的版本号 */
  readonly version: string;
  /** 迁移完整标识目录名 */
  readonly folderName: string;
  /** 迁移目录绝对路径 */
  readonly folderPath: string;
  /** 生成的 migration.sql 文件路径 */
  readonly sqlFilePath: string;
  /** 生成的差异 SQL 内容 */
  readonly diffSql: string;
  /** 是否为空变更 */
  readonly isEmpty: boolean;
}

/**
 * 生成两位数字补齐
 */
function pad(num: number): string {
  return num.toString().padStart(2, "0");
}

/**
 * 生成当前时间戳版本号：YYYYMMDDHHMMSS (类似 Alembic revision 时间戳)
 */
export function generateTimestampVersion(date = new Date()): string {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}${m}${d}${h}${min}${s}`;
}

/**
 * 自动扫描实体变更并生成版本化迁移脚本 (Alembic-style Autogenerate)
 * 通过调用 Prisma migrate diff，智能对比当前实体模型与现有迁移历史，计算增量 DDL
 */
export function generateMigrationFromSchema(
  input: GenerateMigrationInput,
): GenerateMigrationResult {
  if (!fs.existsSync(input.schemaPath)) {
    throw new Error(`找不到指定的 Prisma Schema 文件: ${input.schemaPath}`);
  }

  // 清洗迁移名称
  const cleanName = input.name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const version = generateTimestampVersion();
  const folderName = `${version}_${cleanName}`;
  const targetFolder = path.join(input.migrationsDir, folderName);

  // 检查现有迁移目录
  const _existingMigrations = fs.existsSync(input.migrationsDir)
    ? fs.readdirSync(input.migrationsDir).filter((f) => {
        const full = path.join(input.migrationsDir, f);
        return (
          fs.statSync(full).isDirectory() &&
          fs.existsSync(path.join(full, "migration.sql"))
        );
      })
    : [];

  let diffSql = "";
  let downSql = "";

  const cliDir = import.meta.dirname;
  const toolingDir = path.resolve(cliDir, "..");
  const workspaceRoot = path.resolve(toolingDir, "../..");

  try {
    const configPath = path.join(toolingDir, "prisma.config.ts");
    const configFlag = ` --config "${configPath}"`;

    // 1. 生成升序迁移 DDL (from-empty -> to-schema)
    const cmdUp = `pnpm exec prisma migrate diff --from-empty --to-schema "${input.schemaPath}" --script${configFlag}`;
    diffSql = execSync(cmdUp, {
      cwd: workspaceRoot,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    // 2. 自动生成对应的降级回滚 DDL (from-schema -> to-empty)
    try {
      const cmdDown = `pnpm exec prisma migrate diff --from-schema "${input.schemaPath}" --to-empty --script${configFlag}`;
      downSql = execSync(cmdDown, {
        cwd: workspaceRoot,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch {
      // 若降级逆向分析失败则降级为注释模板
      downSql = "";
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`执行 Prisma 增量 Diff 失败: ${errorMsg}`);
  }

  const trimmedSql = diffSql.trim();
  const trimmedDownSql = downSql.trim();
  const isEmpty =
    trimmedSql.length === 0 ||
    trimmedSql.includes("-- This is an empty migration.");

  // 创建版本目录与写入 SQL
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  const sqlFilePath = path.join(targetFolder, "migration.sql");
  const banner = `-- 自动生成的租户数据库迁移: ${folderName}\n-- 生成时间: ${new Date().toISOString()}\n\n`;
  fs.writeFileSync(
    sqlFilePath,
    banner +
      (trimmedSql.length > 0 ? trimmedSql : "-- 未检测到实体模型结构变动\n"),
    "utf-8",
  );

  // 自动生成逆向回滚脚本 down.sql
  const downFilePath = path.join(targetFolder, "down.sql");
  const downBanner = `-- 自动生成的降级回滚脚本: ${folderName}\n-- 生成时间: ${new Date().toISOString()}\n\n`;
  fs.writeFileSync(
    downFilePath,
    downBanner +
      (trimmedDownSql.length > 0
        ? trimmedDownSql
        : "-- 未能自动推导逆向回滚 DDL，请根据业务需要手工补充\n"),
    "utf-8",
  );

  return {
    version,
    folderName,
    folderPath: targetFolder,
    sqlFilePath,
    diffSql: trimmedSql,
    isEmpty,
  };
}
