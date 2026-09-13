import { getServerAuthRuntime } from "@base/auth";
import { CaslAbilityFactory, type AppPrismaAbility } from "@base/authorization";
import { resolveEmployeeTopology } from "@base/db-tenant";
import { orderCatalog } from "../catalog";
import {
  getTenantDbContext,
  assertOrderAbility,
  type TenantDbContext,
} from "../shared/server/tenant-context";

export interface TenantOrderContext extends TenantDbContext {
  readonly ability: AppPrismaAbility<string, string>;
}

/**
 * 业务区域装配层：组合底座租户 DB 上下文与 Order Center 全域 PermissionCatalog
 */
export async function getTenantOrderContext(): Promise<TenantOrderContext> {
  const dbCtx = await getTenantDbContext();
  const runtime = getServerAuthRuntime();

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
    orderCatalog,
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

export { assertOrderAbility };
