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
  const existingMigrations = fs.existsSync(input.migrationsDir)
    ? fs.readdirSync(input.migrationsDir).filter((f) => {
        const full = path.join(input.migrationsDir, f);
        return (
          fs.statSync(full).isDirectory() &&
          fs.existsSync(path.join(full, "migration.sql"))
        );
      })
    : [];

  let diffSql = "";

  try {
    if (existingMigrations.length === 0) {
      // 首次生成：从空基线对比当前 Schema
      const cmd = `pnpm exec prisma migrate diff --from-empty --to-schema "${input.schemaPath}" --script`;
      diffSql = execSync(cmd, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    } else {
      // 增量生成：从已有迁移历史对比当前 Schema
      const cmd = `pnpm exec prisma migrate diff --from-migrations "${input.migrationsDir}" --to-schema "${input.schemaPath}" --script`;
      diffSql = execSync(cmd, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`执行 Prisma 增量 Diff 失败: ${errorMsg}`);
  }

  const trimmedSql = diffSql.trim();
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

  // 生成配套降级回滚脚手架文件 down.sql
  const downFilePath = path.join(targetFolder, "down.sql");
  fs.writeFileSync(
    downFilePath,
    `-- 自动生成的降级回滚模板: ${folderName}\n-- 请根据业务需求补齐逆向 DDL 操作\n`,
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
