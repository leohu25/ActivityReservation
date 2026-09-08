import type {
  TenantContextRepository,
  TenantDatabaseRecord,
} from "@chenrun/db-control";

export interface TenantDbClient {
  $disconnect(): Promise<void>;
}

export interface SecretResolver {
  resolveDatabaseUrl(secretRef: string): Promise<string>;
}

export interface TenantClientFactoryOptions {
  organizationId: string;
  databaseUrl: string;
}

export type TenantClientFactory<Client extends TenantDbClient> = (
  options: TenantClientFactoryOptions,
) => Promise<Client> | Client;

export type TenantDbRoutingErrorCode =
  | "TENANT_DATABASE_NOT_FOUND"
  | "TENANT_DATABASE_INACTIVE"
  | "TENANT_DATABASE_SECRET_INVALID"
  | "MANAGER_CLOSING"
  | "MANAGER_CLOSED";

export class TenantDbRoutingError extends Error {
  constructor(
    public readonly code: TenantDbRoutingErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "TenantDbRoutingError";
  }
}

export * from "./sql-executor";
export * from "./migration-types";
export * from "./migration-runner";
export * from "./tenant-provisioner";
export * from "./department-topology";
export * from "./database-seeder";

/**
 * 将已授权的租户组织请求路由至其专属物理数据库。
 * 敏感连接串仅通过 SecretResolver 解析，严禁客户端直接传入连接串。
 */
export class TenantDbManager<Client extends TenantDbClient> {
  private readonly clients = new Map<string, Client>();
  private readonly initializing = new Map<string, Promise<Client>>();
  private state: "open" | "closing" | "closed" = "open";
  private closePromise: Promise<void> | undefined;

  constructor(
    private readonly repository: TenantContextRepository,
    private readonly secretResolver: SecretResolver,
    private readonly clientFactory: TenantClientFactory<Client>,
  ) {}

  async getClient(organizationId: string): Promise<Client> {
    this.assertOpen();

    const cached = this.clients.get(organizationId);
    if (cached) {
      return Promise.resolve(cached);
    }

    const pending = this.initializing.get(organizationId);
    if (pending) {
      return pending;
    }

    const initialization = this.createClient(organizationId);
    this.initializing.set(organizationId, initialization);
    const clearInitialization = () => {
      if (this.initializing.get(organizationId) === initialization) {
        this.initializing.delete(organizationId);
      }
    };
    void initialization.then(clearInitialization, clearInitialization);
    return initialization;
  }

  async evict(organizationId: string): Promise<void> {
    this.assertOpen();
    const pending = this.initializing.get(organizationId);
    if (pending) {
      try {
        await pending;
      } catch {
        return;
      }
    }

    const client = this.clients.get(organizationId);
    if (!client) {
      return;
    }
    this.clients.delete(organizationId);
    await client.$disconnect();
  }

  closeAll(): Promise<void> {
    if (this.closePromise) {
      return this.closePromise;
    }

    this.state = "closing";
    this.closePromise = this.drainAndClose();
    return this.closePromise;
  }

  private async drainAndClose(): Promise<void> {
    const failures: unknown[] = [];
    try {
      const pendingResults = await Promise.allSettled([
        ...this.initializing.values(),
      ]);
      for (const result of pendingResults) {
        if (result.status === "rejected") {
          failures.push(result.reason);
        }
      }

      // 初始化器在解析前先行缓存客户端，优先等待确保所有成功创建的客户端均被纳入断连回收
      const clients = new Set(this.clients.values());
      this.clients.clear();
      const disconnectResults = await Promise.allSettled(
        [...clients].map((client) => client.$disconnect()),
      );
      for (const result of disconnectResults) {
        if (result.status === "rejected") {
          failures.push(result.reason);
        }
      }
    } finally {
      this.state = "closed";
      this.initializing.clear();
    }

    if (failures.length > 0) {
      throw new AggregateError(
        failures,
        "One or more tenant database clients failed to close",
      );
    }
  }

  private assertOpen(): void {
    if (this.state === "closing") {
      throw new TenantDbRoutingError(
        "MANAGER_CLOSING",
        "Tenant database manager is closing",
      );
    }
    if (this.state === "closed") {
      throw new TenantDbRoutingError(
        "MANAGER_CLOSED",
        "Tenant database manager is closed",
      );
    }
  }

  private async createClient(organizationId: string): Promise<Client> {
    const mapping = await this.getActiveMapping(organizationId);
    const databaseUrl = await this.secretResolver.resolveDatabaseUrl(
      mapping.secretRef,
    );
    if (databaseUrl.trim().length === 0) {
      throw new TenantDbRoutingError(
        "TENANT_DATABASE_SECRET_INVALID",
        "The tenant database secret resolved to an empty connection URL",
      );
    }

    const client = await this.clientFactory({ organizationId, databaseUrl });
    this.clients.set(organizationId, client);
    return client;
  }

  private async getActiveMapping(
    organizationId: string,
  ): Promise<TenantDatabaseRecord> {
    const mapping = await this.repository.findTenantDatabase(organizationId);
    if (!mapping) {
      throw new TenantDbRoutingError(
        "TENANT_DATABASE_NOT_FOUND",
        "The organization has no tenant database mapping",
      );
    }
    if (mapping.status !== "ACTIVE") {
      throw new TenantDbRoutingError(
        "TENANT_DATABASE_INACTIVE",
        "The organization's tenant database is not active",
      );
    }
    return mapping;
  }
}

import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient as GeneratedTenantPrismaClient,
  type Prisma as TenantPrisma,
} from "@prisma/client-tenant";

export type TenantPrismaClient = GeneratedTenantPrismaClient;
export type { TenantPrisma };

/**
 * 根据数据库连接串创建租户专属的 Prisma 客户端实例
 */
export function createTenantPrismaClient(
  databaseUrl: string,
): TenantPrismaClient {
  if (databaseUrl.trim().length === 0) {
    throw new Error("TENANT_DATABASE_URL is required");
  }
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new GeneratedTenantPrismaClient({ adapter });
}

/**
 * 默认的 Secret 动态连接串解析器
 */
export function createDefaultSecretResolver(
  baseDatabaseUrl?: string,
): SecretResolver {
  return {
    async resolveDatabaseUrl(secretRef: string): Promise<string> {
      if (secretRef.startsWith("env:")) {
        const envKey = secretRef.slice(4);
        return process.env[envKey] ?? "";
      }
      if (
        secretRef.startsWith("url:") ||
        secretRef.startsWith("postgresql://") ||
        secretRef.startsWith("postgres://")
      ) {
        return secretRef.startsWith("url:") ? secretRef.slice(4) : secretRef;
      }
      const adminDbUrl =
        baseDatabaseUrl ??
        process.env.CONTROL_DATABASE_URL ??
        process.env.TENANT_DATABASE_URL ??
        "postgresql://postgres:postgres@localhost:5432/saas_control";
      try {
        const url = new URL(adminDbUrl);
        url.pathname = `/${secretRef}`;
        return url.toString();
      } catch {
        return "";
      }
    },
  };
}

export interface DefaultTenantDbManagerOptions {
  repository: TenantContextRepository;
  secretResolver?: SecretResolver;
  clientFactory?: TenantClientFactory<TenantPrismaClient>;
}

/**
 * 创建针对 TenantPrismaClient 的默认租户数据库管理器实例
 */
export function createDefaultTenantDbManager(
  options: DefaultTenantDbManagerOptions,
): TenantDbManager<TenantPrismaClient> {
  const secretResolver =
    options.secretResolver ?? createDefaultSecretResolver();
  const clientFactory =
    options.clientFactory ??
    (({ databaseUrl }) => createTenantPrismaClient(databaseUrl));

  return new TenantDbManager<TenantPrismaClient>(
    options.repository,
    secretResolver,
    clientFactory,
  );
}

let tenantDbManagerSingleton: TenantDbManager<TenantPrismaClient> | undefined;

/**
 * 获取租户物理数据库管理器单例
 */
export function getTenantDbManager(
  options?: Partial<DefaultTenantDbManagerOptions>,
): TenantDbManager<TenantPrismaClient> {
  if (tenantDbManagerSingleton) {
    return tenantDbManagerSingleton;
  }
  if (!options?.repository) {
    throw new Error(
      "初始化 TenantDbManager 单例需要提供 TenantContextRepository",
    );
  }
  tenantDbManagerSingleton = createDefaultTenantDbManager({
    repository: options.repository,
    secretResolver: options.secretResolver,
    clientFactory: options.clientFactory,
  });
  return tenantDbManagerSingleton;
}

/**
 * 重置租户数据库管理器单例（清理缓存与关闭连接，主要用于测试或进程退出）
 */
export async function resetTenantDbManager(): Promise<void> {
  if (tenantDbManagerSingleton) {
    const manager = tenantDbManagerSingleton;
    tenantDbManagerSingleton = undefined;
    await manager.closeAll();
  }
}
