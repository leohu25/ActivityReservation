import { headers } from "next/headers";
import {
  getCurrentTenantContext,
  getServerAuthRuntime,
  assertTenantAccessGate,
} from "@chenrun/auth";
import {
  CaslAbilityFactory,
  getAccessibleWhere,
  getFieldMode,
  type AppPrismaAbility,
} from "@chenrun/authorization";
import {
  getTenantDbManager,
  resolveEmployeeTopology,
  type ResolvedDepartmentTopology,
} from "@chenrun/db-tenant";
import { toPlainData } from "@chenrun/shared";
import {
  procurementCatalog,
  type ProcurementAction,
} from "@chenrun/feature-procurement-center";
import type {
  EmployeeProfileDTO,
  WorkbenchDataDTO,
  WorkbenchPageData,
} from "@chenrun/feature-tenant-admin/workbench";

export type { EmployeeProfileDTO, WorkbenchDataDTO, WorkbenchPageData };

/**
 * 获取租户工作台页面所需的完整纯数据 DTO (Server-Side Facade)
 * 装配在 apps/tenant/src/kernel，聚合业务能力与四层门禁
 */
export async function getTenantWorkbenchData(): Promise<WorkbenchPageData> {
  const reqHeaders = await headers();

  let tenantCtx;
  try {
    tenantCtx = await getCurrentTenantContext(reqHeaders);
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : "";
    const isNoOrg =
      rawMsg.includes("no active organization") ||
      rawMsg.includes("ACTIVE_ORGANIZATION_REQUIRED");
    return {
      kind: "unauthenticated",
      message: rawMsg,
      isNoOrg,
    };
  }

  const authRuntime = getServerAuthRuntime();
  const org = await authRuntime.prisma.organization.findUnique({
    where: { id: tenantCtx.organizationId },
    select: { id: true, name: true, slug: true, authorizationVersion: true },
  });

  const manager = getTenantDbManager({
    repository: authRuntime.tenantContextRepository,
  });
  const tenantPrisma = await manager.getClient(tenantCtx.organizationId);

  const profile = (await tenantPrisma.employeeProfile.findUnique({
    where: { memberId: tenantCtx.member.id },
    include: {
      department: { select: { id: true, name: true, code: true } },
      position: { select: { id: true, name: true, code: true } },
    },
  })) as EmployeeProfileDTO | null;

  try {
    assertTenantAccessGate(profile);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "员工档案状态异常，业务准入受限";
    return {
      kind: "blocked",
      message,
      status: profile?.status,
    };
  }

  const topology: ResolvedDepartmentTopology = await resolveEmployeeTopology(
    {
      findEmployeeProfile: async (memberId: string) =>
        tenantPrisma.employeeProfile.findUnique({
          where: { memberId },
          select: {
            id: true,
            memberId: true,
            departmentId: true,
            employeeNo: true,
            jobTitle: true,
            status: true,
          },
        }),
      findAllDepartments: async () =>
        tenantPrisma.department.findMany({
          select: { id: true, parentId: true },
        }),
    },
    { userId: tenantCtx.user.id, memberId: tenantCtx.member.id },
  );

  const factory = new CaslAbilityFactory(
    authRuntime.tenantContextRepository,
    procurementCatalog,
  );

  const prismaAbility = (await factory.createPrismaAbilityForTenant(
    tenantCtx,
    topology,
  )) as AppPrismaAbility<ProcurementAction, "PurchaseOrder">;

  const sqlWhere = getAccessibleWhere(prismaAbility, "PurchaseOrder", "read");

  const data: WorkbenchDataDTO = {
    kind: "authenticated",
    org: {
      name: org?.name ?? "ERP 租户控制台",
      slug: org?.slug ?? tenantCtx.organizationId,
      authorizationVersion: org?.authorizationVersion ?? 1,
    },
    user: {
      name: tenantCtx.user.name || tenantCtx.user.email,
      role: tenantCtx.member.role,
    },
    profile,
    treeCount: topology.departmentTreeIds.length,
    sqlWhere,
    fieldModes: {
      supplierName: getFieldMode(
        prismaAbility,
        "PurchaseOrder",
        "supplierName",
      ),
      costPrice: getFieldMode(prismaAbility, "PurchaseOrder", "costPrice"),
      quantity: getFieldMode(prismaAbility, "PurchaseOrder", "quantity"),
    },
    permissions: {
      canReadOrder: prismaAbility.can("read", "PurchaseOrder"),
      canCreateOrder: prismaAbility.can("create", "PurchaseOrder"),
      canAuditOrder: prismaAbility.can("audit", "PurchaseOrder"),
      canExportOrder: prismaAbility.can("export", "PurchaseOrder"),
    },
  };

  return toPlainData(data);
}
