import { generateUuidV7 } from "@base/shared";
import { TENANT_BASE_SEED_SQL } from "@runtime/db";
import type {
  TenantSqlExecutor,
  TenantSqlExecutorFactory,
} from "../migration/sql-executor";

/**
 * 租户独立物理数据库基线种子初始化输入契约
 */
export interface TenantSeedInput {
  /** 租户组织唯一标识 ID */
  readonly organizationId: string;
  /** 租户企业全称 */
  readonly organizationName: string;
  /** 租户最高管理者 (Owner) 平台全局 User ID */
  readonly ownerUserId: string;
  /** 租户最高管理者 (Owner) 租户成员 Member ID */
  readonly ownerMemberId: string;
  /** 租户最高管理者姓名快照 */
  readonly ownerName: string;
  /** 租户最高管理者邮箱快照 */
  readonly ownerEmail: string;
}

/**
 * 默认初始化的租户岗位字典
 */
export const DEFAULT_TENANT_POSITIONS = [
  {
    name: "总经理",
    code: "pos_gm",
    description: "企业最高管理负责人",
    sort: 1,
    status: "ACTIVE",
  },
  {
    name: "部门主管",
    code: "pos_supervisor",
    description: "部门业务管理负责人",
    sort: 10,
    status: "ACTIVE",
  },
  {
    name: "业务专员",
    code: "pos_specialist",
    description: "基层核心业务经办人员",
    sort: 20,
    status: "ACTIVE",
  },
] as const;

/**
 * 租户基线种子初始化执行结果
 */
export interface TenantSeedResult {
  /** 初始根部门 ID */
  readonly rootDepartmentId: string;
  /** 成功注入的岗位字典数量 */
  readonly seededPositionsCount: number;
  /** 初始 Owner 员工档案 ID */
  readonly ownerEmployeeProfileId: string;
}

/**
 * 租户独立物理数据库基线数据种子初始化引擎 (Tenant Database Seeder)
 * 职责：在租户物理库完成基线 Schema 迁移后，直接消费从 @runtime/db 导入的原生 SQL 种子 TENANT_BASE_SEED_SQL
 * 幂等初始化：
 * 1. 企业根部门 (ROOT)
 * 2. 基础岗位字典 (总经理、主管、业务专员)
 * 3. 初始 Owner 员工档案 (在职激活态)
 */
export class TenantDatabaseSeeder {
  constructor(private readonly sqlExecutorFactory?: TenantSqlExecutorFactory) {}

  /**
   * 执行租户基线种子数据初始化（幂等安全，可多次重复执行）
   */
  async seedTenant(
    executorOrUrl: TenantSqlExecutor | string,
    input: TenantSeedInput,
  ): Promise<TenantSeedResult> {
    if (typeof executorOrUrl === "string") {
      if (!this.sqlExecutorFactory) {
        throw new Error(
          "TenantDatabaseSeeder: 传入数据库连接串时必须提供 sqlExecutorFactory",
        );
      }
      const executor = await this.sqlExecutorFactory(executorOrUrl);
      try {
        return await this.seedTenantWithExecutor(executor, input);
      } finally {
        await executor.close();
      }
    }

    return this.seedTenantWithExecutor(executorOrUrl, input);
  }

  /**
   * 基于已打开的 SQL 执行器执行种子填充
   */
  private async seedTenantWithExecutor(
    executor: TenantSqlExecutor,
    input: TenantSeedInput,
  ): Promise<TenantSeedResult> {
    // 1. 显式执行预置 packages/runtime/db/seeds/tenant-seed.sql 原生 SQL 文件
    const posGmId = generateUuidV7();
    const posSupervisorId = generateUuidV7();
    const posSpecialistId = generateUuidV7();

    const existingDepts = await executor.query<{ id: string }>(
      'SELECT id FROM "department" WHERE "code" = $1 LIMIT 1',
      ["ROOT"],
    );

    let rootDeptId: string;
    if (existingDepts.length > 0 && existingDepts[0]?.id) {
      rootDeptId = existingDepts[0].id;
    } else {
      rootDeptId = generateUuidV7();
    }

    // 执行前先检查已存在的岗位数量
    const existingPositionsBefore = await executor.query<{ id: string }>(
      'SELECT id FROM "position" WHERE "code" IN (\'pos_gm\', \'pos_supervisor\', \'pos_specialist\')',
    );

    await executor.execute(TENANT_BASE_SEED_SQL, [
      rootDeptId,
      input.organizationName,
      input.ownerMemberId,
      posGmId,
      posSupervisorId,
      posSpecialistId,
    ]);

    const seededPositionsCount = Math.max(0, 3 - existingPositionsBefore.length);

    // 2. Owner 员工档案 (EmployeeProfile): 检查是否已存在 member_id=ownerMemberId 的档案
    const existingProfiles = await executor.query<{ id: string }>(
      'SELECT id FROM "employee_profile" WHERE "member_id" = $1 LIMIT 1',
      [input.ownerMemberId],
    );

    let ownerEmployeeProfileId: string;
    if (existingProfiles.length > 0 && existingProfiles[0]?.id) {
      ownerEmployeeProfileId = existingProfiles[0].id;
    } else {
      ownerEmployeeProfileId = generateUuidV7();
      const now = new Date();
      await executor.execute(
        `INSERT INTO "employee_profile" (
          "id", "user_id", "member_id", "employee_no", "department_id",
          "position_id", "name_snapshot", "email_snapshot", "job_title",
          "status", "joined_at", "created_at", "updated_at"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )`,
        [
          ownerEmployeeProfileId,
          input.ownerUserId,
          input.ownerMemberId,
          "E0001",
          rootDeptId,
          "pos_gm", // 默认指派总经理岗位
          input.ownerName,
          input.ownerEmail,
          "企业所有者",
          "ACTIVE",
          now,
        ],
      );
    }

    return {
      rootDepartmentId: rootDeptId,
      seededPositionsCount,
      ownerEmployeeProfileId,
    };
  }
}

/**
 * 便捷导出：针对独立租户 SQL 执行器一键灌装初始基线数据
 */
export async function seedTenantBaseline(
  executor: TenantSqlExecutor,
  input: TenantSeedInput,
): Promise<TenantSeedResult> {
  const seeder = new TenantDatabaseSeeder();
  return seeder.seedTenant(executor, input);
}
