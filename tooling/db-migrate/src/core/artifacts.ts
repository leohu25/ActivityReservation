import fs from "node:fs";
import path from "node:path";
import { computeSha256, parseMigrationFolderName } from "@base/shared";
import type {
  BaselineArtifact,
  BaselineManifest,
  MigrationArtifact,
  MigrationManifest,
  MigrationScope,
} from "./types";
import { assertRiskApproval } from "./risk";
import { getBaselinesDir, getMigrationsDir } from "./paths";

function parseJsonFile<T>(filePath: string): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch (error) {
    throw new Error(
      `Unable to parse JSON artifact ${filePath}: ${String(error)}`,
    );
  }
}

export function loadMigrationArtifacts(
  workspaceRoot: string,
  scope: MigrationScope,
): readonly MigrationArtifact[] {
  const directory = getMigrationsDir(workspaceRoot, scope);
  if (!fs.existsSync(directory)) return [];
  const artifacts: MigrationArtifact[] = [];
  for (const entry of fs
    .readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    const parsed = parseMigrationFolderName(entry.name);
    if (!parsed)
      throw new Error(`Invalid migration folder name: ${entry.name}`);
    const folder = path.join(directory, entry.name);
    const manifest = parseJsonFile<MigrationManifest>(
      path.join(folder, "manifest.json"),
    );
    const upSql = fs.readFileSync(path.join(folder, "migration.sql"), "utf-8");
    const downPath = path.join(folder, "down.sql");
    const downSql = fs.existsSync(downPath)
      ? fs.readFileSync(downPath, "utf-8")
      : undefined;
    if (manifest.scope !== scope || manifest.version !== parsed.version) {
      throw new Error(`Migration manifest identity mismatch: ${entry.name}`);
    }
    if (computeSha256(upSql) !== manifest.checksum) {
      throw new Error(`Migration checksum mismatch: ${entry.name}`);
    }
    assertRiskApproval(manifest.risks, manifest.approval);
    artifacts.push({ ...manifest, upSql, downSql });
  }
  return artifacts;
}

export function loadLatestBaseline(
  workspaceRoot: string,
  scope: MigrationScope,
): BaselineArtifact {
  const directory = getBaselinesDir(workspaceRoot, scope);
  const versions = fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const version = versions.at(-1);
  if (!version) throw new Error(`No ${scope} baseline is available`);
  const folder = path.join(directory, version);
  const manifest = parseJsonFile<BaselineManifest>(
    path.join(folder, "manifest.json"),
  );
  const sql = fs.readFileSync(path.join(folder, "baseline.sql"), "utf-8");
  if (manifest.scope !== scope || manifest.version !== version) {
    throw new Error(`Baseline manifest identity mismatch: ${scope}/${version}`);
  }
  if (computeSha256(sql) !== manifest.checksum) {
    throw new Error(`Baseline checksum mismatch: ${scope}/${version}`);
  }
  return { ...manifest, sql };
}
