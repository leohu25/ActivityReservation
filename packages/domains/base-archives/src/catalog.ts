import { derivePermissionCatalog } from "@base/authorization";
import { baseArchivesManifest } from "./manifest";

/** 基础档案权限目录（契约 → Catalog，供 Ability 与角色树同源） */
export const baseArchivesCatalog = derivePermissionCatalog([
	baseArchivesManifest,
]);

export type BaseArchivesCatalog = typeof baseArchivesCatalog;
