import fs from "node:fs";
import path from "node:path";
import {
  computeSha256,
  compareMigrationVersions,
  parseMigrationFolderName,
} from "@chenrun/shared";
import type { PlatformMigrationDefinition } from "./types";

/**
 * 扫描并加载平台迁移目录下的所有版本化迁移脚本
 */
export function loadPlatformMigrationsFromDirectory(
  migrationsDir: string,
): readonly PlatformMigrationDefinition[] {
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  const entries = fs.readdirSync(migrationsDir, { withFileTypes: true });
  const migrations: PlatformMigrationDefinition[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const folderName = entry.name;
    const parsed = parseMigrationFolderName(folderName);
    if (!parsed) continue;

    const folderPath = path.join(migrationsDir, folderName);
    const upFile = path.join(folderPath, "migration.sql");
    if (!fs.existsSync(upFile)) continue;

    const upSql = fs.readFileSync(upFile, "utf-8");
    const checksum = computeSha256(upSql);

    const downFile = path.join(folderPath, "down.sql");
    const downSql = fs.existsSync(downFile)
      ? fs.readFileSync(downFile, "utf-8")
      : undefined;

    migrations.push({
      version: parsed.version,
      name: parsed.name,
      description: `从平台迁移目录加载: ${folderName}`,
      checksum,
      upSql,
      downSql,
    });
  }

  return migrations.sort((a, b) =>
    compareMigrationVersions(a.version, b.version),
  );
}
