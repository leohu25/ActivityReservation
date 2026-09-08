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

      // Initializers cache clients before resolving, so awaiting them first
      // guarantees every successfully created client is included here.
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
