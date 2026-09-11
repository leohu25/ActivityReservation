import { derivePermissionCatalog } from "@chenrun/authorization";
import { customerManifest } from "./manifest";

/** 客户中心权限目录（契约 → Catalog，供 Ability 与角色树同源） */
export const customerCatalog = derivePermissionCatalog([customerManifest]);

export type CustomerCatalog = typeof customerCatalog;
