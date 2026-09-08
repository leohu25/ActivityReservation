import { createPermissionCatalog } from "@chenrun/authorization";
import { procurementPermissionDefinition } from "./permissions";

export * from "./permissions";

/** 采购中心专属权限目录（供 CASL Ability 编译使用） */
export const procurementCatalog = createPermissionCatalog([
  procurementPermissionDefinition,
] as const);

export type ProcurementCatalog = typeof procurementCatalog;
