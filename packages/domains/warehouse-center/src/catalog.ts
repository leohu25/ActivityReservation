import { derivePermissionCatalog } from "@base/authorization";
import { warehouseCenterManifest } from "./manifest";

/** 仓储中心权限目录 */
export const warehouseCenterCatalog = derivePermissionCatalog([
	warehouseCenterManifest,
]);

export type WarehouseCenterCatalog = typeof warehouseCenterCatalog;
