import fs from "node:fs";
import path from "node:path";
import {
  findWorkspaceRoot,
  getBaselinesDir,
  getMigrationsDir,
} from "../core/paths";
import type { MigrationScope } from "../core/types";
import { loadLatestBaseline, loadMigrationArtifacts } from "../core/artifacts";
import { buildCanonicalSchema } from "../schema/aggregate";
import { diffCommentsSql } from "../schema/diff-comments";
import { runPrismaDiff, validatePrismaSchema } from "./prisma";

export function diffSchema(input: {
  readonly scope: MigrationScope;
  readonly workspaceRoot?: string;
  readonly script?: boolean;
}): {
  readonly hasChange: boolean;
  readonly summary: string;
  readonly sql: string;
} {
  const workspaceRoot = findWorkspaceRoot(input.workspaceRoot);
  const baseline = loadLatestBaseline(workspaceRoot, input.scope);
  const baselineSchemaPath = path.join(
    getBaselinesDir(workspaceRoot, input.scope),
    baseline.version,
    "schema.prisma",
  );

  const schema = buildCanonicalSchema(workspaceRoot, input.scope);
  const cacheDir = path.join(workspaceRoot, "node_modules/.cache/db-migrate");
  fs.mkdirSync(cacheDir, { recursive: true });
  const schemaPath = path.join(cacheDir, `${input.scope}-canonical.prisma`);
  fs.writeFileSync(schemaPath, schema, "utf-8");
  validatePrismaSchema(workspaceRoot, schemaPath);

  const previousMigrations = loadMigrationArtifacts(workspaceRoot, input.scope);
  const fromSchemaPath =
    previousMigrations.length > 0
      ? path.join(
          getMigrationsDir(workspaceRoot, input.scope),
          `${previousMigrations.at(-1)!.version}_${previousMigrations.at(-1)!.name}`,
          "schema.snapshot.prisma",
        )
      : baselineSchemaPath;

  const rawSql = runPrismaDiff({
    workspaceRoot,
    fromSchema: fromSchemaPath,
    toSchema: schemaPath,
  });
  const fromSchema = fs.readFileSync(fromSchemaPath, "utf-8");
  const commentsDiffSql = diffCommentsSql(fromSchema, schema);

  const hasStructuralChange =
    rawSql.trim().length > 0 && !rawSql.includes("This is an empty migration");
  const hasCommentsChange = Boolean(commentsDiffSql.trim());
  const hasChange = hasStructuralChange || hasCommentsChange;

  let sql = "";
  if (hasStructuralChange) {
    sql += rawSql.trim();
  }
  if (hasCommentsChange) {
    if (sql) sql += "\n\n-- Comments Migration\n";
    sql += `${commentsDiffSql.trim()}\n`;
  }

  let summary = "";
  if (hasChange) {
    const changes: string[] = [];
    if (hasStructuralChange) changes.push("表结构/字段结构变更 (DDL)");
    if (hasCommentsChange) changes.push("字段/模型文档注释变更 (Comment)");
    summary = `• [${input.scope}] 检测到以下变更待生成迁移: ${changes.join("、")}`;
  } else {
    summary = `✔ [${input.scope}] 当前 Schema 与最新版本完全同步，未发现任何结构漂移或新增字段。`;
  }

  return { hasChange, summary, sql };
}
