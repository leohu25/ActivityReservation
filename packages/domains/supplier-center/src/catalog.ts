import { derivePermissionCatalog } from "@base/authorization";
import { supplierCenterManifest } from "./manifest";

/** 供应商中心权限目录 */
export const supplierCenterCatalog = derivePermissionCatalog([
	supplierCenterManifest,
]);

export type SupplierCenterCatalog = typeof supplierCenterCatalog;
