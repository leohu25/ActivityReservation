/**
 * @chenrun/foundation
 * SaaS 底座核心：Auth / Tenant Context / 权限守卫契约
 */

import type { DataScope } from "@chenrun/shared";

export interface TenantContextPayload {
 tenantId: string;
 tenantCode: string;
 databaseUrl: string;
}

export interface UserSessionPayload {
 userId: string;
 email: string;
 tenantId: string;
 roles: string[];
 permissions: string[];
 dataScope: DataScope;
 deptId?: string;
}

export interface TenantContextStore {
 getTenant(): TenantContextPayload | null;
 getSession(): UserSessionPayload | null;
}
