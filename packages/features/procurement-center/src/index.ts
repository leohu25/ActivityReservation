import { createPermissionCatalog } from "@chenrun/authorization";
import { procurementPermissionDefinition } from "./permissions";

export * from "./permissions";
export * from "./manifest";
export * from "./types";
export * from "./services";
export * from "./components";
export * from "./actions";

/** 采购中心专属权限目录（供 CASL Ability 编译使用） */
export const procurementCatalog = createPermissionCatalog([
  procurementPermissionDefinition,
] as const);

export type ProcurementCatalog = typeof procurementCatalog;
