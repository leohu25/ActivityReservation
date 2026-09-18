import { derivePermissionCatalog } from "@base/authorization";
import { orderManifest } from "./manifest";

/** 订单中心权限目录（契约 → Catalog） */
export const orderCatalog = derivePermissionCatalog([orderManifest]);

export type OrderCatalog = typeof orderCatalog;
