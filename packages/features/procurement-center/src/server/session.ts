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
import {
  getProcurementPrismaClient,
  type ProcurementPrismaClient,
} from "../db/client";
import { procurementCatalog } from "../index";
import type { ProcurementAction } from "../contracts";
import { ProcurementOrderService } from "../services/procurement-order-service";

export interface TenantProcurementContext {
  readonly organizationId: string;
  readonly userId: string;
  readonly memberId: string;
  readonly role: string;
  readonly prisma: TenantPrismaClient;
  readonly procurementPrisma: ProcurementPrismaClient;
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

  const { getServerAuthRuntime, assertTenantAccessGate } = await import(
    "@chenrun/auth"
  );
  const runtime = getServerAuthRuntime();

  const manager = getTenantDbManager({
    repository: runtime.tenantContextRepository,
  });
  const tenantPrisma = await manager.getClient(tenantCtx.organizationId);

  // 严格执行租户准入门禁断言：核验当前成员在租户物理库中的员工档案状态 (Fail-Closed)
  const employeeProfile = await tenantPrisma.employeeProfile.findUnique({
    where: { memberId: tenantCtx.member.id },
    select: {
      id: true,
      memberId: true,
      departmentId: true,
      employeeNo: true,
      jobTitle: true,
      status: true,
    },
  });
  assertTenantAccessGate(employeeProfile);

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

  // 解析当前租户独立数据库连接 URL 并获取采购中心专属 Prisma Client
  const secretResolver = (manager as any).secretResolver;
  const tenantRecord = await runtime.tenantContextRepository.findTenantDatabase(
    tenantCtx.organizationId,
  );
  if (!tenantRecord) {
    throw new Error(
      `Tenant database not configured for organization ${tenantCtx.organizationId}`,
    );
  }

  const databaseUrl = await secretResolver.resolveDatabaseUrl(
    tenantRecord.secretRef,
  );
  const procurementPrisma = getProcurementPrismaClient(databaseUrl);

  return {
    organizationId: tenantCtx.organizationId,
    userId: tenantCtx.user.id,
    memberId: tenantCtx.member.id,
    role: tenantCtx.member.role,
    prisma: tenantPrisma,
    procurementPrisma,
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
