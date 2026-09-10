import fs from "node:fs";
import path from "node:path";
import { computeSha256 } from "@chenrun/shared";
import type { MigrationScope } from "./core/types";
import {
  findWorkspaceRoot,
  getBaselinesDir,
  getRuntimeCatalogPath,
} from "./core/paths";
import { loadLatestBaseline, loadMigrationArtifacts } from "./core/artifacts";
import { buildCanonicalSchema } from "./schema/aggregate";

function checkScope(workspaceRoot: string, scope: MigrationScope): void {
  const baseline = loadLatestBaseline(workspaceRoot, scope);
  const baselineSchema = fs.readFileSync(
    path.join(
      getBaselinesDir(workspaceRoot, scope),
      baseline.version,
      "schema.prisma",
    ),
    "utf-8",
  );
  const canonical = buildCanonicalSchema(workspaceRoot, scope);
  if (computeSha256(canonical) !== baseline.schemaChecksum) {
    throw new Error(
      `${scope} schema changed without a generated migration/baseline. Run pnpm db:migrate:generate --scope ${scope} --name <name>.`,
    );
  }
  if (canonical !== baselineSchema) {
    throw new Error(`${scope} baseline schema content is not canonical`);
  }
  const migrations = loadMigrationArtifacts(workspaceRoot, scope);
  let previousVersion: string | null = baseline.version;
  for (const migration of migrations) {
    if (migration.previousVersion !== previousVersion) {
      throw new Error(
        `${scope} migration chain is broken at ${migration.version}: expected previousVersion ${previousVersion}`,
      );
    }
    previousVersion = migration.version;
  }
}

export function checkMigrationArtifacts(workspaceRootInput?: string): void {
  const workspaceRoot = findWorkspaceRoot(workspaceRootInput);
  checkScope(workspaceRoot, "platform");
  checkScope(workspaceRoot, "tenant");
  if (!fs.existsSync(getRuntimeCatalogPath(workspaceRoot))) {
    throw new Error("Generated runtime migration catalog is missing");
  }
}
