import { createPermissionCatalog } from "@chenrun/authorization";
import { procurementPermissionDefinition } from "@chenrun/feature-procurement-center/permissions";

/** Application composition root for concrete action and subject unions. */
export const applicationPermissionCatalog = createPermissionCatalog([
  procurementPermissionDefinition,
] as const);
