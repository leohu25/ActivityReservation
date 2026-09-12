import { getServerAuthRuntime } from "@chenrun/auth";
import {
  CaslAbilityFactory,
  type AppPrismaAbility,
} from "@chenrun/authorization";
import { resolveEmployeeTopology } from "@chenrun/db-tenant";
import { customerCatalog } from "../catalog";
import {
  getTenantDbContext,
  assertCustomerAbility,
  type TenantDbContext,
} from "../shared/server/tenant-context";

export interface TenantCustomerContext extends TenantDbContext {
  readonly ability: AppPrismaAbility<string, string>;
}

/**
 * 业务区域 (Business Area) 装配层：
 * 组合底座租户 DB 上下文与 Customer Center 全域 PermissionCatalog，
 * 解析当前操作人的部门架构树并调用 createPrismaAbilityForTenant 注入数据范围条件，
 * 编译出具备完整 CASL 权限树与行级数据范围能力的运行时实例。
 */
export async function getTenantCustomerContext(): Promise<TenantCustomerContext> {
  const dbCtx = await getTenantDbContext();
  const runtime = getServerAuthRuntime();

  // 动态自驱解析当前登录用户在该租户内的部门拓扑 (Fail-Closed)
  const topology = await resolveEmployeeTopology(
    {
      findEmployeeProfile: async (memberId: string) => {
        return dbCtx.client.employeeProfile.findUnique({
          where: { memberId },
          select: {
            id: true,
            memberId: true,
            departmentId: true,
            employeeNo: true,
            jobTitle: true,
            status: true,
          },
        });
      },
      findAllDepartments: async () => {
        return dbCtx.client.department.findMany({
          select: { id: true, parentId: true },
        });
      },
    },
    {
      userId: dbCtx.userId,
      memberId: dbCtx.memberId,
    },
  );

  const factory = new CaslAbilityFactory(
    runtime.tenantContextRepository,
    customerCatalog,
  );
  const ability = (await factory.createPrismaAbilityForTenant(
    dbCtx.tenantCtx,
    topology,
  )) as AppPrismaAbility<string, string>;

  return {
    ...dbCtx,
    ability,
  };
}

export { assertCustomerAbility };
