/**
 * @chenrun/db-control
 * Control DB (saas_control) 基础设施访问契约
 */

export interface TenantRecord {
 id: string;
 code: string;
 name: string;
 status: "ACTIVE" | "SUSPENDED" | "DELETED";
 createdAt: Date;
 updatedAt: Date;
}

export interface TenantDatabaseRecord {
 id: string;
 tenantId: string;
 host: string;
 port: number;
 database: string;
 username: string;
 encryptedPassword?: string;
 ssl: boolean;
}

export interface ControlDbClient {
 getTenantByCode(code: string): Promise<TenantRecord | null>;
 getTenantDatabase(tenantId: string): Promise<TenantDatabaseRecord | null>;
}
