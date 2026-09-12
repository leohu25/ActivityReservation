import { derivePermissionCatalog } from "@base/authorization";
import { tenantAdminManifest } from "./manifest";

/** 租户管理切片权限目录（契约 → Catalog，供 Ability 与角色树同源） */
export const tenantAdminCatalog = derivePermissionCatalog([tenantAdminManifest]);

export type TenantAdminCatalog = typeof tenantAdminCatalog;
