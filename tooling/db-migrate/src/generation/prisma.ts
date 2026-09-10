import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { getMigrationPackageRoot } from "../core/paths";

export function resolvePrismaCli(workspaceRoot: string): string {
  const cliPath = path.join(
    getMigrationPackageRoot(workspaceRoot),
    "node_modules/prisma/build/index.js",
  );
  if (!fs.existsSync(cliPath)) {
    throw new Error(
      `Prisma CLI is unavailable at ${cliPath}. Run pnpm install at the workspace root.`,
    );
  }
  return cliPath;
}

function resolvePrismaConfig(workspaceRoot: string): string {
  return path.join(getMigrationPackageRoot(workspaceRoot), "prisma.config.ts");
}

export function runPrismaDiff(input: {
  readonly workspaceRoot: string;
  readonly fromSchema?: string;
  readonly fromEmpty?: boolean;
  readonly toSchema?: string;
  readonly toEmpty?: boolean;
}): string {
  const args = [
    resolvePrismaCli(input.workspaceRoot),
    "migrate",
    "diff",
    "--config",
    resolvePrismaConfig(input.workspaceRoot),
  ];
  if (input.fromEmpty) args.push("--from-empty");
  if (input.fromSchema) args.push("--from-schema", input.fromSchema);
  if (input.toEmpty) args.push("--to-empty");
  if (input.toSchema) args.push("--to-schema", input.toSchema);
  args.push("--script");
  return execFileSync(process.execPath, args, {
    cwd: input.workspaceRoot,
    encoding: "utf-8",
    env: { ...process.env },
  });
}

export function validatePrismaSchema(
  workspaceRoot: string,
  schemaPath: string,
): void {
  execFileSync(
    process.execPath,
    [
      resolvePrismaCli(workspaceRoot),
      "validate",
      "--config",
      resolvePrismaConfig(workspaceRoot),
      "--schema",
      schemaPath,
    ],
    {
      cwd: workspaceRoot,
      encoding: "utf-8",
      stdio: "pipe",
      env: { ...process.env },
    },
  );
}
