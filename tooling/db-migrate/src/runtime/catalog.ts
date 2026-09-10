import {
  PLATFORM_MIGRATION_CATALOG,
  TENANT_MIGRATION_CATALOG,
} from "../../generated/runtime-catalog";
import type { MigrationRuntimeCatalog, MigrationScope } from "../core/types";

export function getMigrationCatalog(
  scope: MigrationScope,
): MigrationRuntimeCatalog {
  return scope === "platform"
    ? PLATFORM_MIGRATION_CATALOG
    : TENANT_MIGRATION_CATALOG;
}
