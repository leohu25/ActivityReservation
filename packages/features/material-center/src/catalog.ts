import { derivePermissionCatalog } from "@base/authorization";
import { materialManifest } from "./manifest";

/** 全局 Material Center CASL PermissionCatalog 实例 */
export const materialCatalog = derivePermissionCatalog([materialManifest]);
