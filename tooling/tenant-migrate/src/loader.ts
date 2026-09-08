import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { TenantMigrationDefinition } from "@chenrun/db-tenant";

/**
 * 计算文件的 SHA-256 摘要哈希（用于版本防篡改审计）
 */
function computeSha256(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

/**
 * 扫描并加载指定目录下的版本化迁移定义列表（类似 Alembic versions 目录扫描）
 */
export function loadMigrationsFromDirectory(
  migrationsDir: string,
): readonly TenantMigrationDefinition[] {
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  const entries = fs.readdirSync(migrationsDir, { withFileTypes: true });
  const migrations: TenantMigrationDefinition[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const folderName = entry.name;
    // 匹配版本目录命名规范：<版本号/时间戳>_<迁移名称>
    const match = folderName.match(
      /^([0-9]{8,14}|v?[0-9]+\.[0-9]+\.[0-9]+)_(.+)$/,
    );
    if (!match) {
      continue;
    }

    const version = match[1];
    const migrationName = match[2];
    const folderPath = path.join(migrationsDir, folderName);
    const sqlFile = path.join(folderPath, "migration.sql");

    if (!fs.existsSync(sqlFile)) {
      continue;
    }

    const upSql = fs.readFileSync(sqlFile, "utf-8");
    const checksum = computeSha256(upSql);

    const downFile = path.join(folderPath, "down.sql");
    const downSql = fs.existsSync(downFile)
      ? fs.readFileSync(downFile, "utf-8")
      : undefined;

    migrations.push({
      version,
      name: migrationName,
      description: `从文件目录加载: ${folderName}`,
      checksum,
      steps: [
        {
          name: "sql_migration",
          up: upSql,
          down: downSql,
        },
      ],
    });
  }

  // 按照版本号自然升序排序
  return migrations.sort((a, b) =>
    a.version.localeCompare(b.version, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
}
