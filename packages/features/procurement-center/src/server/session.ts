import { headers } from "next/headers";
import { getCurrentTenantContext } from "@chenrun/auth";
import {
  CaslAbilityFactory,
  type AppPrismaAbility,
} from "@chenrun/authorization";
import {
  getTenantDbManager,
  resolveEmployeeTopology,
  type TenantPrismaClient,
  type ResolvedDepartmentTopology,
} from "@chenrun/db-tenant";
import { procurementCatalog } from "../index";
import type { ProcurementAction } from "../permissions";
import { ProcurementOrderService } from "../services/procurement-order-service";

export interface TenantProcurementContext {
  readonly organizationId: string;
  readonly userId: string;
  readonly memberId: string;
  readonly role: string;
  readonly prisma: TenantPrismaClient;
  readonly topology: ResolvedDepartmentTopology;
  readonly ability: AppPrismaAbility<ProcurementAction, "PurchaseOrder">;
}

/**
 * 解析并构建当前请求的可信租户物理数据库客户端与四层 CASL 鉴权 Ability
 */
export async function getTenantProcurementContext(): Promise<TenantProcurementContext> {
  const reqHeaders = await headers();
  // 严格基于 Better Auth 签名 Session 解析可信上下文 (Fail-Closed)
  const tenantCtx = await getCurrentTenantContext(reqHeaders);

  const { getServerAuthRuntime } = await import("@chenrun/auth");
  const runtime = getServerAuthRuntime();

  const manager = getTenantDbManager({
    repository: runtime.tenantContextRepository,
  });
  const tenantPrisma = await manager.getClient(tenantCtx.organizationId);

  // 动态自驱解析当前登录用户在该租户内的部门拓扑
  const topology = await resolveEmployeeTopology(
    {
      findEmployeeProfile: async (memberId: string) => {
        return tenantPrisma.employeeProfile.findUnique({
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
        return tenantPrisma.department.findMany({
          select: { id: true, parentId: true },
        });
      },
    },
    {
      userId: tenantCtx.user.id,
      memberId: tenantCtx.member.id,
    },
  );

  // 工厂回源读取 Control DB 中持久化的四层配置并自动下推编译
  const factory = new CaslAbilityFactory(
    runtime.tenantContextRepository,
    procurementCatalog,
  );

  const ability = (await factory.createPrismaAbilityForTenant(
    tenantCtx,
    topology,
  )) as AppPrismaAbility<ProcurementAction, "PurchaseOrder">;

  return {
    organizationId: tenantCtx.organizationId,
    userId: tenantCtx.user.id,
    memberId: tenantCtx.member.id,
    role: tenantCtx.member.role,
    prisma: tenantPrisma,
    topology,
    ability,
  };
}

let orderServiceInstance: ProcurementOrderService | undefined;

export function getProcurementOrderService(): ProcurementOrderService {
  if (!orderServiceInstance) {
    orderServiceInstance = new ProcurementOrderService();
  }
  return orderServiceInstance;
}
