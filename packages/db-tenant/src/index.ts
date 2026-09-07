/**
 * @chenrun/db-tenant
 * Tenant DB (Database-per-Tenant) 动态路由与访问契约
 */

export interface TenantDbClientOptions {
 tenantId: string;
 databaseUrl: string;
}

export interface TenantDbManager {
 getClient(tenantId: string): Promise<unknown>;
 evict(tenantId: string): Promise<void>;
 closeAll(): Promise<void>;
}
