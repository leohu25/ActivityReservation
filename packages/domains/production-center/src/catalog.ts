import { derivePermissionCatalog } from "@base/authorization";
import { productionCenterManifest } from "./manifest";

/** 生产中心权限目录 */
export const productionCenterCatalog = derivePermissionCatalog([
	productionCenterManifest,
]);

export type ProductionCenterCatalog = typeof productionCenterCatalog;
