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
  type FieldAccessMode,
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

export interface EmployeeProfileDTO {
  readonly id: string;
  readonly memberId: string | null;
  readonly employeeNo: string | null;
  readonly nameSnapshot: string;
  readonly emailSnapshot: string;
  readonly jobTitle: string | null;
  readonly status: string;
  readonly department: {
    readonly id: string;
    readonly name: string;
    readonly code: string;
  } | null;
  readonly position: {
    readonly id: string;
    readonly name: string;
    readonly code: string;
  } | null;
}

export interface WorkbenchDataDTO {
  readonly kind: "authenticated";
  readonly org: {
    readonly name: string;
    readonly slug: string;
    readonly authorizationVersion: number;
  };
  readonly user: {
    readonly name: string;
    readonly role: string;
  };
  readonly profile: EmployeeProfileDTO | null;
  readonly treeCount: number;
  readonly sqlWhere: unknown;
  readonly fieldModes: {
    readonly supplierName: FieldAccessMode;
    readonly costPrice: FieldAccessMode;
    readonly quantity: FieldAccessMode;
  };
  readonly permissions: {
    readonly canReadOrder: boolean;
    readonly canCreateOrder: boolean;
    readonly canAuditOrder: boolean;
    readonly canExportOrder: boolean;
  };
}

export interface WorkbenchUnauthenticatedDTO {
  readonly kind: "unauthenticated";
  readonly message: string;
  readonly isNoOrg: boolean;
}

export interface WorkbenchBlockedDTO {
  readonly kind: "blocked";
  readonly message: string;
  readonly status?: string;
}

export type WorkbenchPageData =
  | WorkbenchDataDTO
  | WorkbenchUnauthenticatedDTO
  | WorkbenchBlockedDTO;

/**
 * 获取租户工作台页面所需的完整纯数据 DTO (Server-Side Facade)
 * 严格遵从 RSC 纯数据与 Fail-Closed 准入门禁原则：
 * 1. 签名 Session 校验租户上下文
 * 2. 真实直连物理数据库，校验 EmployeeProfile 准入门禁
 * 3. 自驱解析部门拓扑树
 * 4. 动态编译 CASL Ability、计算数据下推 sqlWhere 与字段三态 fieldModes
 * 5. 全量数据经 toPlainData 清洗后输出，杜绝 Class / 函数跨 RSC 边界泄露
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
