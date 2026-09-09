import pg from "pg";
import type {
  PlatformMigrationDefinition,
  PlatformMigrationRecord,
  PlatformMigrationStatusReport,
} from "./types";

const { Client } = pg;

export class PlatformMigrationRunner {
  constructor(private readonly connectionString: string) {}

  private async withClient<T>(
    fn: (client: pg.Client) => Promise<T>,
  ): Promise<T> {
    const client = new Client({ connectionString: this.connectionString });
    await client.connect();
    try {
      return await fn(client);
    } finally {
      await client.end();
    }
  }

  /**
   * 确保 platform_migration 迁移账本表存在
   */
  async ensureMigrationTable(): Promise<void> {
    await this.withClient(async (client) => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS "platform_migration" (
          "version" VARCHAR(30) NOT NULL PRIMARY KEY,
          "migration_name" VARCHAR(100) NOT NULL,
          "checksum" VARCHAR(64),
          "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
    });
  }

  /**
   * 获取当前平台迁移状态
   */
  async getStatus(
    availableMigrations: readonly PlatformMigrationDefinition[],
  ): Promise<PlatformMigrationStatusReport> {
    await this.ensureMigrationTable();

    return this.withClient(async (client) => {
      const res = await client.query<PlatformMigrationRecord>(`
        SELECT 
          "version",
          "migration_name" AS "migrationName",
          "checksum",
          "applied_at" AS "appliedAt"
        FROM "platform_migration"
        ORDER BY "version" ASC;
      `);

      const applied = res.rows;
      const appliedVersionSet = new Set(applied.map((m) => m.version));
      const pending = availableMigrations.filter(
        (m) => !appliedVersionSet.has(m.version),
      );

      const currentVersion = applied.at(-1)?.version;

      return {
        currentVersion,
        appliedMigrations: applied,
        pendingMigrations: pending,
      };
    });
  }

  /**
   * 执行所有待升级的迁移 (up)
   */
  async up(
    availableMigrations: readonly PlatformMigrationDefinition[],
    targetVersion?: string,
  ): Promise<{ appliedCount: number; appliedVersions: string[] }> {
    await this.ensureMigrationTable();

    return this.withClient(async (client) => {
      const res = await client.query<{ version: string }>(
        `SELECT "version" FROM "platform_migration" ORDER BY "version" ASC;`,
      );
      const appliedVersionSet = new Set(res.rows.map((r) => r.version));

      const toApply = availableMigrations.filter((m) => {
        if (appliedVersionSet.has(m.version)) return false;
        if (targetVersion && m.version > targetVersion) return false;
        return true;
      });

      const appliedVersions: string[] = [];

      for (const migration of toApply) {
        await client.query("BEGIN;");
        try {
          // 执行迁移 DDL / DML
          await client.query(migration.upSql);

          // 记录账本
          await client.query(
            `INSERT INTO "platform_migration" ("version", "migration_name", "checksum", "applied_at")
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP);`,
            [migration.version, migration.name, migration.checksum ?? null],
          );

          await client.query("COMMIT;");
          appliedVersions.push(migration.version);
        } catch (error) {
          await client.query("ROLLBACK;");
          throw new Error(
            `平台迁移 ${migration.version}_${migration.name} 执行失败: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }

      return {
        appliedCount: appliedVersions.length,
        appliedVersions,
      };
    });
  }

  /**
   * 紧急回退上一版本 (down)
   */
  async down(
    availableMigrations: readonly PlatformMigrationDefinition[],
  ): Promise<{ rolledBackVersion?: string }> {
    await this.ensureMigrationTable();

    return this.withClient(async (client) => {
      const res = await client.query<{
        version: string;
        migration_name: string;
      }>(
        `SELECT "version", "migration_name" FROM "platform_migration" ORDER BY "version" DESC LIMIT 1;`,
      );

      if (res.rows.length === 0) {
        return {};
      }

      const latest = res.rows[0];
      const def = availableMigrations.find((m) => m.version === latest.version);
      if (!def) {
        throw new Error(`找不到版本 ${latest.version} 的迁移定义`);
      }
      if (!def.downSql || !def.downSql.trim()) {
        throw new Error(`迁移 ${latest.version} 未提供回滚脚本 (down.sql)`);
      }

      await client.query("BEGIN;");
      try {
        await client.query(def.downSql);
        await client.query(
          `DELETE FROM "platform_migration" WHERE "version" = $1;`,
          [latest.version],
        );
        await client.query("COMMIT;");
        return { rolledBackVersion: latest.version };
      } catch (error) {
        await client.query("ROLLBACK;");
        throw new Error(
          `平台迁移 ${latest.version} 回退失败: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    });
  }
}
