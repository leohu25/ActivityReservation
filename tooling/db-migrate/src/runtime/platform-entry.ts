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
