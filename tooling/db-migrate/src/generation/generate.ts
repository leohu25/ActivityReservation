import fs from "node:fs";
import path from "node:path";
import { computeSha256 } from "@chenrun/shared";
import type {
  BaselineManifest,
  DestructiveApproval,
  MigrationManifest,
  MigrationRuntimeCatalog,
  MigrationScope,
} from "../core/types";
import {
  findWorkspaceRoot,
  getBaselinesDir,
  getMigrationPackageRoot,
  getMigrationsDir,
  getRuntimeCatalogPath,
} from "../core/paths";
import { detectMigrationRisks, assertRiskApproval } from "../core/risk";
import { buildCanonicalSchema } from "../schema/aggregate";
import {
  extractSchemaComments,
  generatePostgresCommentsSql,
} from "../schema/comments";
import { diffCommentsSql } from "../schema/diff-comments";
import { runPrismaDiff, validatePrismaSchema } from "./prisma";
import { loadLatestBaseline, loadMigrationArtifacts } from "../core/artifacts";

function timestampVersion(now = new Date()): string {
  return now
    .toISOString()
    .replace(/[-:T.Z]/g, "")
    .slice(0, 14);
}

function sanitizeName(name: string): string {
  const value = name.toLowerCase().replace(/[^a-z0-9_]+/g, "_");
  if (!value || value === "_") throw new Error("Migration name is required");
  return value.replace(/^_+|_+$/g, "");
}

function writeCanonicalTemp(
  workspaceRoot: string,
  scope: MigrationScope,
): { readonly schema: string; readonly path: string } {
  const schema = buildCanonicalSchema(workspaceRoot, scope);
  const cacheDir = path.join(workspaceRoot, "node_modules/.cache/db-migrate");
  fs.mkdirSync(cacheDir, { recursive: true });
  const schemaPath = path.join(cacheDir, `${scope}-canonical.prisma`);
  fs.writeFileSync(schemaPath, schema, "utf-8");
  validatePrismaSchema(workspaceRoot, schemaPath);
  return { schema, path: schemaPath };
}

function clearDirectories(directory: string): void {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory)) {
    fs.rmSync(path.join(directory, entry), { recursive: true, force: true });
  }
}

export function generateBaseline(input: {
  readonly scope: MigrationScope;
  readonly workspaceRoot?: string;
  readonly version?: string;
  readonly reset?: boolean;
}): BaselineManifest {
  const workspaceRoot = findWorkspaceRoot(input.workspaceRoot);
  const { schema, path: schemaPath } = writeCanonicalTemp(
    workspaceRoot,
    input.scope,
  );
  const version = input.version ?? timestampVersion();
  const baselineRoot = getBaselinesDir(workspaceRoot, input.scope);
  const migrationsRoot = getMigrationsDir(workspaceRoot, input.scope);
  if (input.reset) {
    clearDirectories(baselineRoot);
    clearDirectories(migrationsRoot);
  }
  const folder = path.join(baselineRoot, version);
  if (fs.existsSync(folder)) {
    throw new Error(`Baseline already exists: ${input.scope}/${version}`);
  }
  const rawSql = runPrismaDiff({
    workspaceRoot,
    fromEmpty: true,
    toSchema: schemaPath,
  });
  const commentsSql = generatePostgresCommentsSql(
    extractSchemaComments(schema),
  );
  const sql = commentsSql
    ? `${rawSql.trim()}\n\n-- Database Comments\n${commentsSql}\n`
    : rawSql;
  const manifest: BaselineManifest = {
    formatVersion: 1,
    scope: input.scope,
    version,
    checksum: computeSha256(sql),
    schemaChecksum: computeSha256(schema),
    generatedAt: new Date().toISOString(),
  };
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, "baseline.sql"), sql, "utf-8");
  fs.writeFileSync(path.join(folder, "schema.prisma"), schema, "utf-8");
  fs.writeFileSync(
    path.join(folder, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf-8",
  );
  const otherScope: MigrationScope =
    input.scope === "platform" ? "tenant" : "platform";
  const otherBaselineRoot = getBaselinesDir(workspaceRoot, otherScope);
  const canGenerateCatalog =
    fs.existsSync(otherBaselineRoot) &&
    fs
      .readdirSync(otherBaselineRoot, { withFileTypes: true })
      .some((entry) => entry.isDirectory());
  if (canGenerateCatalog) {
    generateRuntimeCatalog(workspaceRoot);
  }
  return manifest;
}

export function generateMigration(input: {
  readonly scope: MigrationScope;
  readonly name: string;
  readonly workspaceRoot?: string;
  readonly allowDestructive?: boolean;
  readonly approval?: DestructiveApproval;
}): MigrationManifest {
  const workspaceRoot = findWorkspaceRoot(input.workspaceRoot);
  const baseline = loadLatestBaseline(workspaceRoot, input.scope);
  const baselineSchemaPath = path.join(
    getBaselinesDir(workspaceRoot, input.scope),
    baseline.version,
    "schema.prisma",
  );
  const { schema, path: schemaPath } = writeCanonicalTemp(
    workspaceRoot,
    input.scope,
  );
  const rawSql = runPrismaDiff({
    workspaceRoot,
    fromSchema: baselineSchemaPath,
    toSchema: schemaPath,
  });
  const baselineSchema = fs.readFileSync(baselineSchemaPath, "utf-8");
  const commentsDiffSql = diffCommentsSql(baselineSchema, schema);

  const hasStructuralChange =
    rawSql.trim() && !rawSql.includes("This is an empty migration");
  const hasCommentsChange = Boolean(commentsDiffSql.trim());

  if (!hasStructuralChange && !hasCommentsChange) {
    throw new Error(`No ${input.scope} schema change was detected`);
  }

  let sql = "";
  if (hasStructuralChange) {
    sql += rawSql.trim();
  }
  if (hasCommentsChange) {
    if (sql) sql += "\n\n-- Comments Migration\n";
    sql += `${commentsDiffSql.trim()}\n`;
  }

  const rawDownSql = runPrismaDiff({
    workspaceRoot,
    fromSchema: schemaPath,
    toSchema: baselineSchemaPath,
  });
  const downCommentsDiffSql = diffCommentsSql(schema, baselineSchema);
  let downSql = "";
  if (rawDownSql.trim() && !rawDownSql.includes("This is an empty migration")) {
    downSql += rawDownSql.trim();
  }
  if (downCommentsDiffSql.trim()) {
    if (downSql) downSql += "\n\n-- Comments Rollback\n";
    downSql += `${downCommentsDiffSql.trim()}\n`;
  }
  const risks = detectMigrationRisks(sql);
  if (risks.length > 0 && !input.allowDestructive) {
    throw new Error(
      `Migration contains risky operations: ${risks.map((risk) => risk.code).join(", ")}`,
    );
  }
  assertRiskApproval(risks, input.approval);
  const version = timestampVersion();
  const name = sanitizeName(input.name);
  const previousMigrations = loadMigrationArtifacts(workspaceRoot, input.scope);
  const previousVersion =
    previousMigrations.at(-1)?.version ?? baseline.version;
  const manifest: MigrationManifest = {
    formatVersion: 1,
    scope: input.scope,
    version,
    name,
    previousVersion,
    checksum: computeSha256(sql),
    schemaChecksum: computeSha256(schema),
    createdAt: new Date().toISOString(),
    risks,
    approval: input.approval,
    rollbackSupported: Boolean(downSql.trim()),
  };
  const folder = path.join(
    getMigrationsDir(workspaceRoot, input.scope),
    `${version}_${name}`,
  );
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, "migration.sql"), sql, "utf-8");
  fs.writeFileSync(path.join(folder, "down.sql"), downSql, "utf-8");
  fs.writeFileSync(
    path.join(folder, "schema.snapshot.prisma"),
    schema,
    "utf-8",
  );
  fs.writeFileSync(
    path.join(folder, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf-8",
  );
  return manifest;
}

function serializeCatalog(catalog: MigrationRuntimeCatalog): string {
  return JSON.stringify(catalog, null, 2);
}

export function generateRuntimeCatalog(workspaceRootInput?: string): void {
  const workspaceRoot = findWorkspaceRoot(workspaceRootInput);
  const platform: MigrationRuntimeCatalog = {
    scope: "platform",
    baseline: loadLatestBaseline(workspaceRoot, "platform"),
    migrations: loadMigrationArtifacts(workspaceRoot, "platform"),
  };
  const tenant: MigrationRuntimeCatalog = {
    scope: "tenant",
    baseline: loadLatestBaseline(workspaceRoot, "tenant"),
    migrations: loadMigrationArtifacts(workspaceRoot, "tenant"),
  };
  const source = `// Generated by @chenrun/db-migrate. Do not edit.\nimport type { MigrationRuntimeCatalog } from "../src/core/types";\n\nexport const PLATFORM_MIGRATION_CATALOG = ${serializeCatalog(platform)} as const satisfies MigrationRuntimeCatalog;\n\nexport const TENANT_MIGRATION_CATALOG = ${serializeCatalog(tenant)} as const satisfies MigrationRuntimeCatalog;\n`;
  fs.writeFileSync(getRuntimeCatalogPath(workspaceRoot), source, "utf-8");
}

export function getToolingRoot(workspaceRootInput?: string): string {
  return getMigrationPackageRoot(findWorkspaceRoot(workspaceRootInput));
}
