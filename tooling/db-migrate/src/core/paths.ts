/// <reference types="node" />
import fs from "node:fs";
import path from "node:path";
import type { MigrationScope } from "./types";

export function findWorkspaceRoot(startDir: string = process.cwd()): string {
  let current = path.resolve(startDir);
  while (current !== path.dirname(current)) {
    if (fs.existsSync(path.join(current, "pnpm-workspace.yaml"))) {
      return current;
    }
    current = path.dirname(current);
  }
  throw new Error(`Unable to locate workspace root from ${startDir}`);
}

export function getMigrationPackageRoot(workspaceRoot: string): string {
  return path.join(workspaceRoot, "tooling/db-migrate");
}

export function getMigrationsDir(
  workspaceRoot: string,
  scope: MigrationScope,
): string {
  return path.join(getMigrationPackageRoot(workspaceRoot), "migrations", scope);
}

export function getBaselinesDir(
  workspaceRoot: string,
  scope: MigrationScope,
): string {
  return path.join(getMigrationPackageRoot(workspaceRoot), "baselines", scope);
}

export function getRuntimeCatalogPath(workspaceRoot: string): string {
  return path.join(
    getMigrationPackageRoot(workspaceRoot),
    "generated/runtime-catalog.ts",
  );
}
