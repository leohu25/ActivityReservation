import { derivePermissionCatalog } from "@base/authorization";
import { productCenterManifest } from "./manifest";

/** 商品中心权限目录 */
export const productCenterCatalog = derivePermissionCatalog([
	productCenterManifest,
]);

export type ProductCenterCatalog = typeof productCenterCatalog;
