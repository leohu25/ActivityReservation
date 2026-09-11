#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { checkMigrationArtifacts } from "./check";
import type { DestructiveApproval, MigrationScope } from "./core/types";
import { findWorkspaceRoot } from "./core/paths";
import {
  generateBaseline,
  generateMigration,
  generateRuntimeCatalog,
} from "./generation/generate";
import { getMigrationCatalog } from "./runtime/catalog";
import {
  platformBootstrapAdminFromEnv,
  seedPlatformBootstrapAdmin,
} from "./runtime/platform-bootstrap";
import { PlatformMigrationRunner } from "./runtime/platform-runner";

function parseArgs(args: readonly string[]): {
  readonly command: string;
  readonly options: Record<string, string | boolean>;
} {
  const options: Record<string, string | boolean> = {};
  const command = args[0] ?? "help";
  for (let index = 1; index < args.length; index++) {
    const item = args[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = args[index + 1];
    if (next && !next.startsWith("--")) {
      options[key] = next;
      index++;
    } else {
      options[key] = true;
    }
  }
  return { command, options };
}

function parseScope(value: string | boolean | undefined): MigrationScope {
  if (value === "platform" || value === "tenant") return value;
  throw new Error("--scope must be platform or tenant");
}

function loadEnvironment(workspaceRoot: string): void {
  for (const relativePath of [
    ".env.local",
    ".env",
    "apps/control/.env.local",
    "apps/tenant/.env.local",
  ]) {
    const filePath = path.join(workspaceRoot, relativePath);
    if (!fs.existsSync(filePath)) continue;
    if (typeof process.loadEnvFile === "function") {
      try {
        process.loadEnvFile(filePath);
      } catch {
        // Later candidates may still contain the required values.
      }
    }
  }
}

function help(): void {
  console.log(`
@chenrun/db-migrate

  db-migrate baseline --scope <platform|tenant> [--version <version>] [--reset]
  db-migrate generate --scope <platform|tenant> --name <name>
      [--allow-destructive --reason <text> --data-plan <text> --rollback-plan <text>]
  db-migrate catalog
  db-migrate check
  db-migrate ensure-platform
`);
}

async function main(): Promise<void> {
  const { command, options } = parseArgs(process.argv.slice(2));
  const workspaceRoot = findWorkspaceRoot();
  loadEnvironment(workspaceRoot);
  if (command === "help" || options.help) {
    help();
    return;
  }
  if (command === "baseline") {
    const result = generateBaseline({
      scope: parseScope(options.scope),
      workspaceRoot,
      version:
        typeof options.version === "string" ? options.version : undefined,
      reset: Boolean(options.reset),
    });
    console.log(`Generated ${result.scope} baseline ${result.version}`);
    return;
  }
  if (command === "generate") {
    const scope = parseScope(options.scope);
    const name = typeof options.name === "string" ? options.name : "";
    let approval: DestructiveApproval | undefined;
    if (options["allow-destructive"]) {
      approval = {
        reason: typeof options.reason === "string" ? options.reason : "",
        dataPlan:
          typeof options["data-plan"] === "string" ? options["data-plan"] : "",
        rollbackPlan:
          typeof options["rollback-plan"] === "string"
            ? options["rollback-plan"]
            : "",
      };
    }
    const result = generateMigration({
      scope,
      name,
      workspaceRoot,
      allowDestructive: Boolean(options["allow-destructive"]),
      approval,
    });
    generateRuntimeCatalog(workspaceRoot);
    console.log(
      `Generated ${scope} migration ${result.version}_${result.name}`,
    );
    return;
  }
  if (command === "catalog") {
    generateRuntimeCatalog(workspaceRoot);
    console.log("Generated runtime migration catalog");
    return;
  }
  if (command === "check") {
    checkMigrationArtifacts(workspaceRoot);
    console.log("Migration artifacts are consistent");
    return;
  }
  if (command === "ensure-platform") {
    const controlDatabaseUrl = process.env.CONTROL_DATABASE_URL;
    if (!controlDatabaseUrl) {
      throw new Error("CONTROL_DATABASE_URL is required");
    }
    const runner = new PlatformMigrationRunner(
      controlDatabaseUrl,
      getMigrationCatalog("platform"),
      { seedBootstrapAdmin: seedPlatformBootstrapAdmin },
    );
    const result = await runner.ensureInitialized(
      platformBootstrapAdminFromEnv(),
    );
    console.log(
      result.status === "INITIALIZED"
        ? `Initialized platform database baseline ${result.baselineVersion}`
        : `Platform database is ${result.status.toLowerCase()} at ${result.currentVersion}`,
    );
    return;
  }
  throw new Error(`Unknown command: ${command}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
