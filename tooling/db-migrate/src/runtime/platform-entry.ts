import { getMigrationCatalog } from "./catalog";
import {
  platformBootstrapAdminFromEnv,
  seedPlatformBootstrapAdmin,
} from "./platform-bootstrap";
import { PlatformMigrationRunner } from "./platform-runner";
import type { EnsureDatabaseResult } from "../core/types";

export { getMigrationCatalog } from "./catalog";
export {
  platformBootstrapAdminFromEnv,
  seedPlatformBootstrapAdmin,
} from "./platform-bootstrap";
export {
  DatabaseInitializationError,
  PlatformMigrationRunner,
  type PlatformBootstrapAdminSeeder,
  type PlatformMigrationRunnerOptions,
} from "./platform-runner";
export type {
  DatabaseInitializationInspection,
  DatabaseInitializationState,
  EnsureDatabaseResult,
  PlatformBootstrapAdminInput,
} from "../core/types";

/**
 * 平台总控库 Day 0 自愈初始化独立函数 (供 Next.js instrumentation 与应用层消费)
 */
export async function ensurePlatformDatabase(): Promise<EnsureDatabaseResult> {
  const controlDatabaseUrl = process.env.CONTROL_DATABASE_URL;
  if (!controlDatabaseUrl) {
    throw new Error("CONTROL_DATABASE_URL is required");
  }
  const runner = new PlatformMigrationRunner(
    controlDatabaseUrl,
    getMigrationCatalog("platform"),
    { seedBootstrapAdmin: seedPlatformBootstrapAdmin },
  );
  return runner.ensureInitialized(platformBootstrapAdminFromEnv());
}
