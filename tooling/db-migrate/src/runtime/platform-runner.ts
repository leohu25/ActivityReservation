import pg from "pg";
import type {
  DatabaseInitializationInspection,
  EnsureDatabaseResult,
  MigrationExecutionResult,
  MigrationPreflightResult,
  MigrationRuntimeCatalog,
  PlatformBootstrapAdminInput,
} from "../core/types";

const { Client } = pg;
const PLATFORM_LOCK_KEY = 904202601;

const PLATFORM_REQUIRED_TABLES = [
  "account",
  "member",
  "organization",
  "platform_migration",
  "session",
  "tenant_database",
  "tenant_migration",
  "user",
] as const;

const PLATFORM_CORE_TABLES = ["user", "organization", "session"] as const;

interface PlatformRecord {
  readonly version: string;
  readonly migrationName: string;
  readonly checksum: string;
}

export type PlatformBootstrapAdminSeeder = (
  client: pg.Client,
  input: PlatformBootstrapAdminInput,
) => Promise<void>;

export interface PlatformMigrationRunnerOptions {
  readonly clientFactory?: () => pg.Client;
  readonly seedBootstrapAdmin?: PlatformBootstrapAdminSeeder;
}

export class DatabaseInitializationError extends Error {
  constructor(
    public readonly code:
      | "DATABASE_UNREACHABLE"
      | "DATABASE_PARTIAL"
      | "BASELINE_CHECKSUM_MISMATCH"
      | "BASELINE_EXECUTION_FAILED"
      | "SEED_CONFIGURATION_MISSING",
    message: string,
  ) {
    super(message);
    this.name = "DatabaseInitializationError";
  }
}

export class PlatformMigrationRunner {
  private readonly clientFactory: () => pg.Client;

  constructor(
    private readonly connectionString: string,
    private readonly catalog: MigrationRuntimeCatalog,
    private readonly options: PlatformMigrationRunnerOptions = {},
  ) {
    this.clientFactory =
      options.clientFactory ??
      (() => new Client({ connectionString: this.connectionString }));
  }

  private async withClient<T>(
    callback: (client: pg.Client) => Promise<T>,
  ): Promise<T> {
    const client = this.clientFactory();
    try {
      await client.connect();
    } catch (error) {
      throw new DatabaseInitializationError(
        "DATABASE_UNREACHABLE",
        `Platform database is unreachable: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    try {
      return await callback(client);
    } finally {
      await client.end();
    }
  }

  private async inspectWithClient(
    client: pg.Client,
  ): Promise<DatabaseInitializationInspection> {
    const tables = await client.query<{ tableName: string }>(`
      SELECT table_name AS "tableName"
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    const present = new Set(tables.rows.map((row) => row.tableName));

    // Ledger-first 空库与残缺库判定：
    // 1. 如果 platform_migration 账本表不存在：
    if (!present.has("platform_migration")) {
      const hasAnyCoreTable = PLATFORM_CORE_TABLES.some((table) =>
        present.has(table),
      );
      // 核心业务表均不存在，判定为全新库 EMPTY（即便云托管库预装了扩展表如 spatial_ref_sys）
      if (!hasAnyCoreTable) {
        return {
          state: "EMPTY",
          scope: "platform",
          baselineVersion: this.catalog.baseline.version,
          currentVersion: null,
          missingTables: PLATFORM_REQUIRED_TABLES,
          pendingMigrations: [],
        };
      }
      // 账本表缺失但已有核心业务表，判定为未受管或残缺库 PARTIAL (Fail-Closed)
      const missingTables = PLATFORM_REQUIRED_TABLES.filter(
        (table) => !present.has(table),
      );
      return {
        state: "PARTIAL",
        scope: "platform",
        baselineVersion: this.catalog.baseline.version,
        currentVersion: null,
        missingTables:
          missingTables.length > 0 ? missingTables : ["platform_migration"],
        pendingMigrations: [],
      };
    }

    // 2. 如果 platform_migration 账本表已存在：
    const missingTables = PLATFORM_REQUIRED_TABLES.filter(
      (table) => !present.has(table),
    );
    if (missingTables.length > 0) {
      return {
        state: "PARTIAL",
        scope: "platform",
        baselineVersion: this.catalog.baseline.version,
        currentVersion: null,
        missingTables,
        pendingMigrations: [],
      };
    }

    const baselineResult = await client.query<PlatformRecord>(
      `SELECT "version", "migration_name" AS "migrationName", "checksum"
       FROM "platform_migration"
       WHERE "version" = $1
       LIMIT 1`,
      [this.catalog.baseline.version],
    );
    const baselineRecord = baselineResult.rows[0];
    if (!baselineRecord || baselineRecord.migrationName !== "baseline") {
      return {
        state: "PARTIAL",
        scope: "platform",
        baselineVersion: this.catalog.baseline.version,
        currentVersion: null,
        missingTables: [],
        pendingMigrations: [],
      };
    }
    if (baselineRecord.checksum !== this.catalog.baseline.checksum) {
      return {
        state: "CHECKSUM_MISMATCH",
        scope: "platform",
        baselineVersion: this.catalog.baseline.version,
        currentVersion: baselineRecord.version,
        missingTables: [],
        pendingMigrations: [],
      };
    }

    const appliedResult = await client.query<PlatformRecord>(`
      SELECT "version", "migration_name" AS "migrationName", "checksum"
      FROM "platform_migration"
      ORDER BY "version" ASC;
    `);
    const applied = new Map(
      appliedResult.rows.map((row) => [row.version, row.checksum]),
    );
    for (const migration of this.catalog.migrations) {
      const checksum = applied.get(migration.version);
      if (checksum && checksum !== migration.checksum) {
        return {
          state: "CHECKSUM_MISMATCH",
          scope: "platform",
          baselineVersion: this.catalog.baseline.version,
          currentVersion:
            appliedResult.rows.at(-1)?.version ?? baselineRecord.version,
          missingTables: [],
          pendingMigrations: [],
        };
      }
    }
    const pendingMigrations = this.catalog.migrations
      .filter((migration) => !applied.has(migration.version))
      .map((migration) => migration.version);
    return {
      state: pendingMigrations.length > 0 ? "UPGRADE_REQUIRED" : "READY",
      scope: "platform",
      baselineVersion: this.catalog.baseline.version,
      currentVersion:
        appliedResult.rows.at(-1)?.version ?? this.catalog.baseline.version,
      missingTables: [],
      pendingMigrations,
    };
  }

  async inspect(): Promise<DatabaseInitializationInspection> {
    return this.withClient((client) => this.inspectWithClient(client));
  }

  private requireBootstrapInput(
    input: PlatformBootstrapAdminInput | undefined,
  ): PlatformBootstrapAdminInput {
    if (
      !input?.email.trim() ||
      !input.name.trim() ||
      input.password.length < 12
    ) {
      throw new DatabaseInitializationError(
        "SEED_CONFIGURATION_MISSING",
        `\x1b[31m✗ [Platform Day 0] 控制台空库初始化需要配置平台初始超级管理员账号\x1b[0m\n` +
          `    \x1b[33m• 缺少环境变量:\x1b[0m CONTROL_BOOTSTRAP_ADMIN_EMAIL, CONTROL_BOOTSTRAP_ADMIN_NAME, CONTROL_BOOTSTRAP_ADMIN_PASSWORD\n` +
          `    \x1b[90m> 请在 apps/control/.env.local 中配置上述变量（密码至少 12 位），参考 apps/control/.env.example。\x1b[0m`,
      );
    }
    return input;
  }

  async ensureInitialized(
    bootstrapAdmin?: PlatformBootstrapAdminInput,
  ): Promise<EnsureDatabaseResult> {
    const startedAt = Date.now();
    return this.withClient(async (client) => {
      let inspection = await this.inspectWithClient(client);
      if (
        inspection.state === "READY" ||
        inspection.state === "UPGRADE_REQUIRED"
      ) {
        return this.toEnsureResult(inspection, false, startedAt);
      }
      if (inspection.state === "PARTIAL") {
        throw new DatabaseInitializationError(
          "DATABASE_PARTIAL",
          `Platform database is non-empty but incomplete; missing tables: ${inspection.missingTables.join(", ") || "baseline ledger"}`,
        );
      }
      if (inspection.state === "CHECKSUM_MISMATCH") {
        throw new DatabaseInitializationError(
          "BASELINE_CHECKSUM_MISMATCH",
          `Platform baseline checksum mismatch for ${inspection.baselineVersion}`,
        );
      }

      const seedInput = this.requireBootstrapInput(bootstrapAdmin);
      if (!this.options.seedBootstrapAdmin) {
        throw new DatabaseInitializationError(
          "SEED_CONFIGURATION_MISSING",
          "Platform bootstrap admin seeder is not configured",
        );
      }

      // 事务级咨询锁：在事务内执行 SET LOCAL lock_timeout 并获取 pg_advisory_xact_lock
      // 事务提交或回滚时锁自动释放，天然兼容 PgBouncer 事务连接池
      await client.query("BEGIN");
      try {
        await client.query("SET LOCAL lock_timeout = '15s'");
        await client.query("SELECT pg_advisory_xact_lock($1)", [
          PLATFORM_LOCK_KEY,
        ]);

        inspection = await this.inspectWithClient(client);
        if (
          inspection.state === "READY" ||
          inspection.state === "UPGRADE_REQUIRED"
        ) {
          await client.query("COMMIT");
          return this.toEnsureResult(inspection, false, startedAt);
        }
        if (inspection.state !== "EMPTY") {
          throw new DatabaseInitializationError(
            inspection.state === "CHECKSUM_MISMATCH"
              ? "BASELINE_CHECKSUM_MISMATCH"
              : "DATABASE_PARTIAL",
            "Platform database changed to an unsafe state while waiting for the initialization lock",
          );
        }

        // 1. 执行全量 Baseline SQL（已包含 platform_migration 账本表与全部平台核心表）
        await client.query(this.catalog.baseline.sql);

        // 2. 登记 Baseline 账本记录
        await client.query(
          `INSERT INTO "platform_migration" ("version", "migration_name", "checksum")
           VALUES ($1, 'baseline', $2)
           ON CONFLICT ("version") DO NOTHING`,
          [this.catalog.baseline.version, this.catalog.baseline.checksum],
        );
        await this.options.seedBootstrapAdmin(client, seedInput);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        if (error instanceof DatabaseInitializationError) {
          throw error;
        }
        throw new DatabaseInitializationError(
          "BASELINE_EXECUTION_FAILED",
          `Platform Day 0 initialization failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      const ready = await this.inspectWithClient(client);
      if (ready.state !== "READY" && ready.state !== "UPGRADE_REQUIRED") {
        throw new DatabaseInitializationError(
          "BASELINE_EXECUTION_FAILED",
          "Platform baseline completed but verification did not reach a ready state",
        );
      }
      return this.toEnsureResult(ready, true, startedAt);
    });
  }

  private toEnsureResult(
    inspection: DatabaseInitializationInspection,
    appliedBaseline: boolean,
    startedAt: number,
  ): EnsureDatabaseResult {
    return {
      status: appliedBaseline
        ? "INITIALIZED"
        : inspection.state === "UPGRADE_REQUIRED"
          ? "UPGRADE_REQUIRED"
          : "READY",
      scope: "platform",
      baselineVersion: inspection.baselineVersion,
      currentVersion: inspection.currentVersion,
      appliedBaseline,
      pendingMigrations: inspection.pendingMigrations,
      durationMs: Date.now() - startedAt,
    };
  }

  private async preflightWithClient(
    client: pg.Client,
  ): Promise<MigrationPreflightResult> {
    const inspection = await this.inspectWithClient(client);
    if (inspection.state === "EMPTY" || inspection.state === "PARTIAL") {
      return {
        currentVersion: inspection.currentVersion,
        targetVersion:
          this.catalog.migrations.at(-1)?.version ??
          this.catalog.baseline.version,
        pendingVersions: [],
        risks: [],
        checksumValid: true,
        executable: false,
        messages: ["Platform baseline must be initialized before migrations"],
      };
    }
    if (inspection.state === "CHECKSUM_MISMATCH") {
      return {
        currentVersion: inspection.currentVersion,
        targetVersion:
          this.catalog.migrations.at(-1)?.version ??
          this.catalog.baseline.version,
        pendingVersions: [],
        risks: [],
        checksumValid: false,
        executable: false,
        messages: ["Platform baseline or migration checksum mismatch"],
      };
    }
    const pending = this.catalog.migrations.filter((migration) =>
      inspection.pendingMigrations.includes(migration.version),
    );
    return {
      currentVersion: inspection.currentVersion,
      targetVersion:
        this.catalog.migrations.at(-1)?.version ??
        this.catalog.baseline.version,
      pendingVersions: pending.map((migration) => migration.version),
      risks: pending.flatMap((migration) => migration.risks),
      checksumValid: true,
      executable: true,
      messages: [],
    };
  }

  async preflight(): Promise<MigrationPreflightResult> {
    return this.withClient((client) => this.preflightWithClient(client));
  }

  async migrate(): Promise<MigrationExecutionResult> {
    return this.withClient(async (client) => {
      await client.query("BEGIN");
      try {
        await client.query("SET LOCAL lock_timeout = '15s'");
        await client.query("SELECT pg_advisory_xact_lock($1)", [
          PLATFORM_LOCK_KEY,
        ]);

        const preflight = await this.preflightWithClient(client);
        if (!preflight.executable) {
          throw new Error(preflight.messages.join("; "));
        }
        const appliedVersions: string[] = [];
        for (const version of preflight.pendingVersions) {
          const migration = this.catalog.migrations.find(
            (artifact) => artifact.version === version,
          );
          if (!migration)
            throw new Error(`Missing platform migration ${version}`);
          await client.query(migration.upSql);
          await client.query(
            `INSERT INTO "platform_migration" ("version", "migration_name", "checksum") VALUES ($1, $2, $3)`,
            [migration.version, migration.name, migration.checksum],
          );
          appliedVersions.push(version);
        }
        await client.query("COMMIT");
        return { appliedCount: appliedVersions.length, appliedVersions };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    });
  }
}
