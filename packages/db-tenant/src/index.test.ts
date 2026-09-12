import assert from "node:assert/strict";
import test from "node:test";
import type {
  TenantContextRepository,
  TenantDatabaseRecord,
} from "@base/db-control";
import {
  TenantDbManager,
  TenantDbRoutingError,
  type TenantDbClient,
} from "./index";

const now = new Date("2026-01-01T00:00:00.000Z");

function mapping(
  organizationId: string,
  status: TenantDatabaseRecord["status"] = "ACTIVE",
): TenantDatabaseRecord {
  return {
    id: `database-${organizationId}`,
    organizationId,
    clusterCode: "cluster-a",
    databaseName: `tenant-${organizationId}`,
    secretRef: `secret/${organizationId}`,
    schemaVersion: "1",
    status,
    createdAt: now,
    updatedAt: now,
  };
}

function repository(
  records: Record<string, TenantDatabaseRecord | undefined>,
): TenantContextRepository {
  return {
    async findMember() {
      throw new Error("membership lookup is not part of DB routing");
    },
    async findTenantDatabase(organizationId) {
      return records[organizationId] ?? null;
    },
  };
}

interface FakeClient extends TenantDbClient {
  organizationId: string;
  disconnects: number;
}

function setup(records: Record<string, TenantDatabaseRecord | undefined>) {
  const creations: Array<{ organizationId: string; databaseUrl: string }> = [];
  const resolvedRefs: string[] = [];
  const manager = new TenantDbManager<FakeClient>(
    repository(records),
    {
      async resolveDatabaseUrl(secretRef) {
        resolvedRefs.push(secretRef);
        return `opaque://${secretRef}`;
      },
    },
    async (options) => {
      creations.push(options);
      const client: FakeClient = {
        organizationId: options.organizationId,
        disconnects: 0,
        async $disconnect() {
          client.disconnects += 1;
        },
      };
      return client;
    },
  );
  return { manager, creations, resolvedRefs };
}

async function rejectsWithCode(
  action: Promise<unknown>,
  code: TenantDbRoutingError["code"],
): Promise<void> {
  await assert.rejects(action, (error: unknown) => {
    return error instanceof TenantDbRoutingError && error.code === code;
  });
}

test("rejects missing and inactive mappings", async () => {
  const { manager } = setup({ suspended: mapping("suspended", "SUSPENDED") });

  await rejectsWithCode(
    manager.getClient("missing"),
    "TENANT_DATABASE_NOT_FOUND",
  );
  await rejectsWithCode(
    manager.getClient("suspended"),
    "TENANT_DATABASE_INACTIVE",
  );
});

test("resolves only secretRef and caches one client per organization", async () => {
  const { manager, creations, resolvedRefs } = setup({ org1: mapping("org1") });

  const first = await manager.getClient("org1");
  const second = await manager.getClient("org1");

  assert.equal(first, second);
  assert.deepEqual(resolvedRefs, ["secret/org1"]);
  assert.deepEqual(creations, [
    { organizationId: "org1", databaseUrl: "opaque://secret/org1" },
  ]);
});

test("runs the optional database ensure hook before creating a tenant client", async () => {
  const events: string[] = [];
  const manager = new TenantDbManager<FakeClient>(
    repository({ org1: mapping("org1") }),
    {
      async resolveDatabaseUrl() {
        return "opaque://org1";
      },
    },
    async ({ organizationId }) => {
      events.push("client");
      return {
        organizationId,
        disconnects: 0,
        async $disconnect() {},
      };
    },
    async ({ organizationId, databaseUrl, mapping: tenantMapping }) => {
      events.push("ensure");
      assert.equal(organizationId, "org1");
      assert.equal(databaseUrl, "opaque://org1");
      assert.equal(tenantMapping.organizationId, "org1");
    },
  );

  await manager.getClient("org1");
  assert.deepEqual(events, ["ensure", "client"]);
});

test("ensure hook failure prevents client creation and can be retried", async () => {
  let ensureCalls = 0;
  let creations = 0;
  const manager = new TenantDbManager<FakeClient>(
    repository({ org1: mapping("org1") }),
    {
      async resolveDatabaseUrl() {
        return "opaque://org1";
      },
    },
    async ({ organizationId }) => {
      creations += 1;
      return {
        organizationId,
        disconnects: 0,
        async $disconnect() {},
      };
    },
    async () => {
      ensureCalls += 1;
      if (ensureCalls === 1) throw new Error("partial tenant database");
    },
  );

  await assert.rejects(manager.getClient("org1"), /partial tenant database/);
  assert.equal(creations, 0);
  await manager.getClient("org1");
  assert.equal(ensureCalls, 2);
  assert.equal(creations, 1);
});

test("deduplicates concurrent first access", async () => {
  let release: (() => void) | undefined;
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  let creations = 0;
  const manager = new TenantDbManager<FakeClient>(
    repository({ org1: mapping("org1") }),
    {
      async resolveDatabaseUrl() {
        await wait;
        return "opaque://org1";
      },
    },
    async ({ organizationId }) => {
      creations += 1;
      const client: FakeClient = {
        organizationId,
        disconnects: 0,
        async $disconnect() {
          client.disconnects += 1;
        },
      };
      return client;
    },
  );

  const first = manager.getClient("org1");
  const second = manager.getClient("org1");
  release!();

  assert.equal(await first, await second);
  assert.equal(creations, 1);
});

test("isolates clients across organizations", async () => {
  const { manager } = setup({ org1: mapping("org1"), org2: mapping("org2") });

  const first = await manager.getClient("org1");
  const second = await manager.getClient("org2");

  assert.notEqual(first, second);
  assert.equal(first.organizationId, "org1");
  assert.equal(second.organizationId, "org2");
});

test("evict disconnects and recreates only the selected organization", async () => {
  const { manager, creations } = setup({ org1: mapping("org1") });
  const first = await manager.getClient("org1");

  await manager.evict("org1");
  const second = await manager.getClient("org1");

  assert.equal(first.disconnects, 1);
  assert.notEqual(first, second);
  assert.equal(creations.length, 2);
});

test("closeAll disconnects every cached client", async () => {
  const { manager } = setup({ org1: mapping("org1"), org2: mapping("org2") });
  const first = await manager.getClient("org1");
  const second = await manager.getClient("org2");

  await manager.closeAll();

  assert.equal(first.disconnects, 1);
  assert.equal(second.disconnects, 1);
});

test("closeAll drains initialization and rejects acquisitions while closing", async () => {
  let release: (() => void) | undefined;
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  const manager = new TenantDbManager<FakeClient>(
    repository({ org1: mapping("org1"), org2: mapping("org2") }),
    {
      async resolveDatabaseUrl() {
        await wait;
        return "opaque://org1";
      },
    },
    async ({ organizationId }) => {
      const client: FakeClient = {
        organizationId,
        disconnects: 0,
        async $disconnect() {
          client.disconnects += 1;
        },
      };
      return client;
    },
  );

  const initializingClient = manager.getClient("org1");
  const closing = manager.closeAll();
  await rejectsWithCode(manager.getClient("org2"), "MANAGER_CLOSING");
  release!();

  const client = await initializingClient;
  await closing;

  assert.equal(client.disconnects, 1);
  await rejectsWithCode(manager.getClient("org1"), "MANAGER_CLOSED");
});

test("rejects an empty secret result without creating a client", async () => {
  let creations = 0;
  const manager = new TenantDbManager<FakeClient>(
    repository({ org1: mapping("org1") }),
    {
      async resolveDatabaseUrl() {
        return "";
      },
    },
    async ({ organizationId }) => {
      creations += 1;
      const client: FakeClient = {
        organizationId,
        disconnects: 0,
        async $disconnect() {
          client.disconnects += 1;
        },
      };
      return client;
    },
  );

  await rejectsWithCode(
    manager.getClient("org1"),
    "TENANT_DATABASE_SECRET_INVALID",
  );
  assert.equal(creations, 0);
});

test("createDefaultSecretResolver 支持 postgresql URL、env 及相对路径解析", async () => {
  const { createDefaultSecretResolver } = await import("./index");
  const resolver = createDefaultSecretResolver(
    "postgresql://postgres:postgres@localhost:5432/saas_control",
  );

  // 1. 直传 postgresql 协议连接串
  const direct = await resolver.resolveDatabaseUrl(
    "postgresql://postgres:pass@remote:5432/custom_db",
  );
  assert.equal(direct, "postgresql://postgres:pass@remote:5432/custom_db");

  // 2. 数据库名相对解析
  const relative = await resolver.resolveDatabaseUrl("tenant_org_test");
  assert.equal(
    relative,
    "postgresql://postgres:postgres@localhost:5432/tenant_org_test",
  );

  // 3. url: 前缀解析
  const urlPrefix = await resolver.resolveDatabaseUrl(
    "url:postgresql://usr:pwd@host:5432/db",
  );
  assert.equal(urlPrefix, "postgresql://usr:pwd@host:5432/db");
});

test("getTenantDbManager 与 resetTenantDbManager 正确管理单例", async () => {
  const { getTenantDbManager, resetTenantDbManager } = await import("./index");
  await resetTenantDbManager();

  assert.throws(() => getTenantDbManager(), /TenantContextRepository/);

  const mockRepo = repository({ org1: mapping("org1") });
  const fakeFactory = async ({
    organizationId,
  }: {
    organizationId: string;
  }) => {
    const client: FakeClient = {
      organizationId,
      disconnects: 0,
      $disconnect: async () => {},
    };
    return client as unknown as import("./index").TenantPrismaClient;
  };

  const manager1 = getTenantDbManager({
    repository: mockRepo,
    clientFactory: fakeFactory,
  });

  const manager2 = getTenantDbManager();
  assert.equal(manager1, manager2);

  await resetTenantDbManager();
  const manager3 = getTenantDbManager({
    repository: mockRepo,
    clientFactory: fakeFactory,
  });
  assert.notEqual(manager1, manager3);
  await resetTenantDbManager();
});
