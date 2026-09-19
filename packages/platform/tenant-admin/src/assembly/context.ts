import { cache } from "react";
import { getServerAuthRuntime } from "@base/auth";
import {
  CaslAbilityFactory,
  type AppPrismaAbility,
} from "@base/authorization";
import { resolveEmployeeTopology } from "@base/db-tenant";
import { tenantAdminCatalog } from "../catalog";
import {
  getTenantDbContext,
  assertTenantAdminAbility,
  type TenantDbContext,
} from "../shared/server/tenant-context";

export interface TenantAdminContext extends TenantDbContext {
  readonly ability: AppPrismaAbility<string, string>;
}

/**
 * 业务区域 (Business Area) 装配层：
 * 组合底座租户 DB 上下文与 tenant-admin 全域 PermissionCatalog，
 * 编译出具备完整 CASL 权限树与 Prisma 数据范围下推的运行时能力实例。
 * React.cache() 请求级去重：同一次 RSC 请求内无论调用多少次只构建一次 Ability。
 */
export const getTenantAdminContext = cache(
  async (): Promise<TenantAdminContext> => {
    const dbCtx = await getTenantDbContext();
    const runtime = getServerAuthRuntime();

    // 动态解析当前成员的部门拓扑
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
      tenantAdminCatalog,
    );
    const ability = (await factory.createPrismaAbilityForTenant(
      dbCtx.tenantCtx,
      topology,
    )) as AppPrismaAbility<string, string>;

    return {
      ...dbCtx,
      ability,
    };
  },
);

export { assertTenantAdminAbility };
