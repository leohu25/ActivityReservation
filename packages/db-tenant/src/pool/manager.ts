import { PrismaPg } from "@prisma/adapter-pg";
import {
  type Prisma as TenantPrisma,
  PrismaClient as GeneratedTenantPrismaClient,
} from "@prisma/client-tenant";
import type {
  TenantContextRepository,
  TenantDatabaseRecord,
} from "@base/db-control";

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

export interface TenantDatabaseEnsureInput {
  readonly organizationId: string;
  readonly databaseUrl: string;
  readonly mapping: TenantDatabaseRecord;
}

export type TenantDatabaseEnsureHook = (
  input: TenantDatabaseEnsureInput,
) => Promise<void>;

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
    private readonly ensureDatabase?: TenantDatabaseEnsureHook,
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

      const disconnectResults = await Promise.allSettled(
        [...this.clients.values()].map((client) => client.$disconnect()),
      );
      for (const result of disconnectResults) {
        if (result.status === "rejected") {
          failures.push(result.reason);
        }
      }
    } finally {
      this.clients.clear();
      this.initializing.clear();
      this.state = "closed";
    }

    if (failures.length > 0) {
      throw failures[0];
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

    await this.ensureDatabase?.({ organizationId, databaseUrl, mapping });
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
  ensureDatabase?: TenantDatabaseEnsureHook;
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
    options.ensureDatabase,
  );
}

// SAFETY: globalThis 类型扩展用于在 Next.js 服务端运行时与热重载生命周期中保持单一 TenantDbManager 实例
const globalForTenantDb = globalThis as unknown as {
  __TENANT_DB_MANAGER__?: TenantDbManager<TenantPrismaClient>;
};

/**
 * 获取租户物理数据库管理器单例（全局唯一复用，防御 Next.js HMR 连接池泄漏）
 */
export function getTenantDbManager(
  options?: Partial<DefaultTenantDbManagerOptions>,
): TenantDbManager<TenantPrismaClient> {
  if (globalForTenantDb.__TENANT_DB_MANAGER__) {
    return globalForTenantDb.__TENANT_DB_MANAGER__;
  }
  if (!options?.repository) {
    throw new Error(
      "初始化 TenantDbManager 单例需要提供 TenantContextRepository",
    );
  }
  const manager = createDefaultTenantDbManager({
    repository: options.repository,
    secretResolver: options.secretResolver,
    clientFactory: options.clientFactory,
    ensureDatabase: options.ensureDatabase,
  });
  globalForTenantDb.__TENANT_DB_MANAGER__ = manager;
  return manager;
}

/**
 * 重置租户数据库管理器单例（清理缓存与关闭连接，主要用于测试或进程退出）
 */
export async function resetTenantDbManager(): Promise<void> {
  if (globalForTenantDb.__TENANT_DB_MANAGER__) {
    const manager = globalForTenantDb.__TENANT_DB_MANAGER__;
    globalForTenantDb.__TENANT_DB_MANAGER__ = undefined;
    await manager.closeAll();
  }
}
