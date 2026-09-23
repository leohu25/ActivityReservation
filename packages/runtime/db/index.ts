import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 数据库运行时切片的核心物理目录与路径事实源
 */
export const DB_RUNTIME_PATHS = {
  root: __dirname,
  prismaSchema: path.join(__dirname, "prisma/schema.prisma"),
  baselines: path.join(__dirname, "baselines"),
  migrations: path.join(__dirname, "migrations"),
  seeds: path.join(__dirname, "seeds"),
} as const;

export function getDbRuntimePath(
  subPath: "baselines" | "migrations" | "seeds" | "prismaSchema",
): string {
  return DB_RUNTIME_PATHS[subPath];
}

/**
 * 显式读取并导出的租户基线预置 SQL 种子内容
 * 供业务层/Seeder 直接以 ESM 标准 import 导入使用，杜绝任何动态相对路径拼接
 */
export const TENANT_BASE_SEED_SQL: string = fs.readFileSync(
  path.join(__dirname, "seeds/tenant-seed.sql"),
  "utf-8",
);

/**
 * 显式读取并导出的平台总控库基线预置 SQL 种子内容
 */
export const PLATFORM_BASE_SEED_SQL: string = fs.readFileSync(
  path.join(__dirname, "seeds/platform-seed.sql"),
  "utf-8",
);

/**
 * 生产 BOM 闭环演示种子数据 SQL (单品加工、组合配方、包装装配)
 */
export const BOM_DEMO_SEED_SQL: string = fs.readFileSync(
  path.join(__dirname, "seeds/bom-demo-seed.sql"),
  "utf-8",
);
