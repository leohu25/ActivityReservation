import test from "node:test";
import assert from "node:assert/strict";
import {
  TenantDatabaseSeeder,
  seedTenantBaseline,
  type TenantSeedInput,
} from "./database-seeder";
import type { TenantSqlExecutor } from "../migration/sql-executor";

/**
 * 内存模拟 SQL 执行器，用于单测验证 Seeder 逻辑与幂等性
 */
class MemoryTenantSqlExecutor implements TenantSqlExecutor {
  readonly departments: Array<Record<string, unknown>> = [];
  readonly positions: Array<Record<string, unknown>> = [];
  readonly profiles: Array<Record<string, unknown>> = [];

  async execute(sql: string, params?: readonly unknown[]): Promise<void> {
    const cleanSql = sql.replace(/\s+/g, " ").trim();

    if (
      cleanSql.includes('INSERT INTO "department"') ||
      cleanSql.includes('INSERT INTO "position"') ||
      cleanSql.includes('INSERT INTO "employee_profile"')
    ) {
      const p = params ?? [];
      // 处理 tenant-seed.sql 联合执行
      if (this.departments.length === 0) {
        this.departments.push({
          id: p[0],
          name: p[1],
          code: "ROOT",
          parentId: null,
          leaderMemberId: p[2] ?? null,
          sort: 0,
          status: "ACTIVE",
        });
      }
      if (this.positions.length === 0) {
        this.positions.push(
          { id: p[3], name: "总经理", code: "pos_gm", sort: 1, status: "ACTIVE" },
          { id: p[4], name: "部门主管", code: "pos_supervisor", sort: 10, status: "ACTIVE" },
          { id: p[5], name: "业务专员", code: "pos_specialist", sort: 20, status: "ACTIVE" },
        );
      }
      if (this.profiles.length === 0) {
        this.profiles.push({
          id: p[6],
          userId: p[7],
          memberId: p[2],
          employeeNo: "E0001",
          departmentId: p[0],
          positionId: "pos_gm",
          name: p[8],
          email: p[9],
          jobTitle: "企业所有者",
          status: "ACTIVE",
          joinedAt: new Date(),
        });
      }
      return;
    }

    throw new Error(`未模拟的 SQL: ${cleanSql}`);
  }

  async query<T = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<T[]> {
    const cleanSql = sql.replace(/\s+/g, " ").trim();

    if (cleanSql.includes('SELECT id FROM "department" WHERE "code" = $1')) {
      const code = params?.[0];
      const match = this.departments.filter((d) => d.code === code);
      return match as unknown as T[];
    }

    if (cleanSql.includes('FROM "position"') || cleanSql.includes('"position"')) {
      if (cleanSql.includes('"code" = $1')) {
        const code = params?.[0];
        const match = this.positions.filter((p) => p.code === code);
        return match as unknown as T[];
      }
      if (cleanSql.includes('"code" IN')) {
        return this.positions.filter((p) =>
          ["pos_gm", "pos_supervisor", "pos_specialist"].includes(p.code as string),
        ) as unknown as T[];
      }
      return this.positions as unknown as T[];
    }

    if (
      cleanSql.includes(
        'SELECT id FROM "employee_profile" WHERE "member_id" = $1',
      )
    ) {
      const memberId = params?.[0];
      const match = this.profiles.filter((p) => p.memberId === memberId);
      return match as unknown as T[];
    }

    return [];
  }

  async transaction<T>(
    callback: (tx: TenantSqlExecutor) => Promise<T>,
  ): Promise<T> {
    return callback(this);
  }

  async close(): Promise<void> {
    // 内存模拟无需真实销毁
  }
}

test("TenantDatabaseSeeder 基线种子初始化与幂等执行", async () => {
  const executor = new MemoryTenantSqlExecutor();
  const seeder = new TenantDatabaseSeeder();

  const seedInput: TenantSeedInput = {
    organizationId: "org_base_test",
    organizationName: "示范制造集团",
    ownerUserId: "usr_owner_001",
    ownerMemberId: "mem_owner_001",
    ownerName: "张三",
    ownerEmail: "zhangsan@example.com",
  };

  // 1. 初次执行种子填充
  const firstResult = await seeder.seedTenant(executor, seedInput);
  assert.ok(firstResult.rootDepartmentId);
  assert.equal(firstResult.seededPositionsCount, 3);
  assert.ok(firstResult.ownerEmployeeProfileId);

  // 验证数据正确注入
  assert.equal(executor.departments.length, 1);
  assert.equal(executor.departments[0]?.code, "ROOT");
  assert.equal(executor.departments[0]?.name, "示范制造集团");
  assert.equal(executor.departments[0]?.leaderMemberId, "mem_owner_001");

  assert.equal(executor.positions.length, 3);
  assert.equal(executor.positions[0]?.code, "pos_gm");
  assert.equal(executor.positions[1]?.code, "pos_supervisor");
  assert.equal(executor.positions[2]?.code, "pos_specialist");

  assert.equal(executor.profiles.length, 1);
  const profile = executor.profiles[0];
  assert.equal(profile?.memberId, "mem_owner_001");
  assert.equal(profile?.userId, "usr_owner_001");
  assert.equal(profile?.employeeNo, "E0001");
  assert.equal(profile?.departmentId, firstResult.rootDepartmentId);
  assert.equal(profile?.name, "张三");
  assert.equal(profile?.email, "zhangsan@example.com");
  assert.equal(profile?.status, "ACTIVE");

  // 2. 再次执行种子填充（测试幂等性）
  const secondResult = await seeder.seedTenant(executor, seedInput);
  assert.equal(secondResult.rootDepartmentId, firstResult.rootDepartmentId);
  assert.equal(secondResult.seededPositionsCount, 0); // 不重复插入
  assert.equal(secondResult.ownerEmployeeProfileId, firstResult.ownerEmployeeProfileId);

  // 集合总数保持不变
  assert.equal(executor.departments.length, 1);
  assert.equal(executor.positions.length, 3);
  assert.equal(executor.profiles.length, 1);

  // 3. 测试便捷包装函数 seedTenantBaseline
  const thirdResult = await seedTenantBaseline(executor, seedInput);
  assert.equal(thirdResult.rootDepartmentId, firstResult.rootDepartmentId);
  assert.equal(executor.departments.length, 1);
});
