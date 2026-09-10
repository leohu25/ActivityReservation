import pg from "pg";
import type {
  MigrationExecutionResult,
  MigrationPreflightResult,
  MigrationRuntimeCatalog,
} from "../core/types";

const { Client } = pg;
const PLATFORM_LOCK_KEY = 904202601;

interface PlatformRecord {
  readonly version: string;
  readonly migrationName: string;
  readonly checksum: string;
}

export class PlatformMigrationRunner {
  constructor(
    private readonly connectionString: string,
    private readonly catalog: MigrationRuntimeCatalog,
  ) {}

  private async withClient<T>(
    callback: (client: pg.Client) => Promise<T>,
  ): Promise<T> {
    const client = new Client({ connectionString: this.connectionString });
    await client.connect();
    try {
      return await callback(client);
    } finally {
      await client.end();
    }
  }

  private async ensureLedger(client: pg.Client): Promise<void> {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "platform_migration" (
        "version" VARCHAR(30) PRIMARY KEY,
        "migration_name" VARCHAR(100) NOT NULL,
        "checksum" VARCHAR(64) NOT NULL,
        "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  private async preflightWithClient(
    client: pg.Client,
  ): Promise<MigrationPreflightResult> {
    await this.ensureLedger(client);
    const result = await client.query<PlatformRecord>(`
      SELECT "version", "migration_name" AS "migrationName", "checksum"
      FROM "platform_migration"
      ORDER BY "version" ASC;
    `);
    const applied = new Map(result.rows.map((row) => [row.version, row]));
    const messages: string[] = [];
    let checksumValid = true;
    for (const migration of this.catalog.migrations) {
      const record = applied.get(migration.version);
      if (record && record.checksum !== migration.checksum) {
        checksumValid = false;
        messages.push(
          `Checksum mismatch for platform migration ${migration.version}`,
        );
      }
    }
    const pending = this.catalog.migrations.filter(
      (migration) => !applied.has(migration.version),
    );
    return {
      currentVersion: result.rows.at(-1)?.version ?? null,
      targetVersion:
        this.catalog.migrations.at(-1)?.version ??
        this.catalog.baseline.version,
      pendingVersions: pending.map((migration) => migration.version),
      risks: pending.flatMap((migration) => migration.risks),
      checksumValid,
      executable: checksumValid,
      messages,
    };
  }

  async preflight(): Promise<MigrationPreflightResult> {
    return this.withClient((client) => this.preflightWithClient(client));
  }

  async migrate(): Promise<MigrationExecutionResult> {
    return this.withClient(async (client) => {
      await this.ensureLedger(client);
      await client.query("SELECT pg_advisory_lock($1)", [PLATFORM_LOCK_KEY]);
      try {
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
          await client.query("BEGIN");
          try {
            await client.query(migration.upSql);
            await client.query(
              `INSERT INTO "platform_migration" ("version", "migration_name", "checksum") VALUES ($1, $2, $3)`,
              [migration.version, migration.name, migration.checksum],
            );
            await client.query("COMMIT");
            appliedVersions.push(version);
          } catch (error) {
            await client.query("ROLLBACK");
            throw error;
          }
        }
        return { appliedCount: appliedVersions.length, appliedVersions };
      } finally {
        await client.query("SELECT pg_advisory_unlock($1)", [
          PLATFORM_LOCK_KEY,
        ]);
      }
    });
  }
}
