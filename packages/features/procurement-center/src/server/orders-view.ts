import { headers } from "next/headers";
import { getCurrentTenantContext, assertTenantAccessGate } from "@chenrun/auth";
import {
  CaslAbilityFactory,
  FieldPolicy,
  getAccessibleWhere,
  type AppPrismaAbility,
} from "@chenrun/authorization";
import {
  getTenantDbManager,
  resolveEmployeeTopology,
} from "@chenrun/db-tenant";
import { toPlainData } from "@chenrun/shared";
import {
  getProcurementFieldVisibility,
  procurementCatalog,
  procurementCreateFields,
  ProcurementOrderService,
  ProcurementSubject,
  type ProcurementAction,
} from "../index";
import type { ProcurementOrderCenterProps } from "../components/ProcurementOrderCenter";

export type ProcurementOrdersPageData =
  | {
      readonly isBlocked: true;
      readonly message: string;
    }
  | {
      readonly isBlocked: false;
      readonly props: ProcurementOrderCenterProps;
    };

/**
 * 获取采购订单中心页面所需的纯数据装配模型 (DTO)
 * 严格遵从 RSC 纯数据与 Fail-Closed 原则：
 * 1. 签名 Session 校验并提取租户上下文与物理库连接
 * 2. 真实核验 EmployeeProfile 租户准入门禁
 * 3. 自驱解析员工部门拓扑
 * 4. CASL PrismaAbility 编译与数据权限下推
 * 5. 纯数据清洗 (toPlainData) 后输出，便于 RSC 零摩擦跨端渲染
 */
export async function getProcurementOrdersPageData(): Promise<ProcurementOrdersPageData> {
  let tenantCtx;
  try {
    const reqHeaders = await headers();
    tenantCtx = await getCurrentTenantContext(reqHeaders);
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : "";
    const isNoDb = rawMsg.includes("no tenant database mapping");
    const msg = isNoDb
      ? "当前激活的企业租户尚未开通专属独立数据库。晨润 ERP 严格遵循 Database-per-Tenant 物理隔离机制，请先在平台管理控制台 (/tenants) 为该租户开通物理库。"
      : rawMsg || "未激活有效的租户会话，请先在右上角选择或激活租户组织";
    return {
      isBlocked: true,
      message: msg,
    };
  }

  const { getServerAuthRuntime } = await import("@chenrun/auth");
  const authRuntime = getServerAuthRuntime();
  const manager = getTenantDbManager({
    repository: authRuntime.tenantContextRepository,
  });
  const tenantPrisma = await manager.getClient(tenantCtx.organizationId);

  // 严格校验租户准入门禁
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

  try {
    assertTenantAccessGate(employeeProfile);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "员工档案状态异常，业务准入受限";
    return {
      isBlocked: true,
      message,
    };
  }

  // 依据当前租户内员工档案自驱解析部门拓扑 (Fail-Closed)
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

  // 构建当前租户与角色的 CASL PrismaAbility
  const factory = new CaslAbilityFactory(
    authRuntime.tenantContextRepository,
    procurementCatalog,
  );

  const prismaAbility = (await factory.createPrismaAbilityForTenant(
    tenantCtx,
    topology,
  )) as AppPrismaAbility<ProcurementAction, "PurchaseOrder">;

  // 查询当前用户在当前租户数据库中的采购订单
  const orderService = new ProcurementOrderService();
  const orders = await orderService.listOrders(
    tenantPrisma,
    prismaAbility,
    tenantCtx.user.id,
  );

  // 提取实时下推条件与权限状态
  const sqlWhere = getAccessibleWhere(
    prismaAbility,
    ProcurementSubject,
    "read",
  );
  const fieldVisibility = getProcurementFieldVisibility(prismaAbility);
  const canCreate =
    prismaAbility.can("create", ProcurementSubject) &&
    procurementCreateFields.every((field) =>
      prismaAbility.can("create", ProcurementSubject, field),
    );
  const canCreateCostPrice = prismaAbility.can(
    "create",
    ProcurementSubject,
    "costPrice",
  );
  const canExport = prismaAbility.can("export", ProcurementSubject);

  let departmentName: string | null = null;
  if (topology.departmentId) {
    const dept = await tenantPrisma.department.findUnique({
      where: { id: topology.departmentId },
      select: { name: true },
    });
    departmentName = dept?.name ?? topology.departmentId;
  }

  const createFieldModes = {
    supplierName: canCreate ? FieldPolicy.EDITABLE : FieldPolicy.HIDDEN,
    quantity: canCreate ? FieldPolicy.EDITABLE : FieldPolicy.HIDDEN,
    costPrice: canCreateCostPrice ? FieldPolicy.EDITABLE : FieldPolicy.HIDDEN,
  };

  return {
    isBlocked: false,
    props: toPlainData({
      orders,
      sqlWhere,
      activeOrgId: tenantCtx.organizationId,
      departmentName,
      canCreate,
      canExport,
      fieldVisibility,
      currentUserId: tenantCtx.user.id,
      createFieldModes,
    }),
  };
}
