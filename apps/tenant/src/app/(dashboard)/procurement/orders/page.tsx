import { headers } from "next/headers";
import { getCurrentTenantContext } from "@chenrun/auth";
import {
  CaslAbilityFactory,
  getAccessibleWhere,
  type AppPrismaAbility,
} from "@chenrun/authorization";
import {
  getTenantDbManager,
  resolveEmployeeTopology,
} from "@chenrun/db-tenant";
import {
  procurementCatalog,
  ProcurementOrderCenter,
  ProcurementOrderService,
  ProcurementSubject,
  type ProcurementAction,
} from "@chenrun/feature-procurement-center";
import { Card } from "@chenrun/ui";
import { AlertCircle } from "lucide-react";

/**
 * 采购订单中心业务页面（极薄服务端组件）
 * 严格遵从分层架构：
 * 1. 签名 Session 提取当前激活租户上下文与物理数据库连接
 * 2. 动态依据租户内 EmployeeProfile 装配部门树拓扑
 * 3. CASL 编译动态数据范围与字段策略
 * 4. 直调 ProcurementOrderService 渲染真实业务数据
 */
export default async function ProcurementOrdersPage() {
  let tenantCtx;
  try {
    tenantCtx = await getCurrentTenantContext(await headers());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "未激活有效的租户会话";
    return (
      <Card className="border-amber-200 bg-amber-50/50 p-6 text-amber-800 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="size-4 text-amber-600 shrink-0" />
          <span>{msg}，请先在右上角选择或激活租户组织</span>
        </div>
      </Card>
    );
  }

  // 1. 获取当前租户独立物理数据库连接
  const manager = getTenantDbManager();
  const tenantPrisma = await manager.getClient(tenantCtx.organizationId);

  // 2. 依据当前租户内员工档案自驱解析部门拓扑 (Fail-Closed)
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

  // 3. 构建当前租户与角色的 CASL PrismaAbility（动态读取 Control DB 持久化四层配置）
  const { getServerAuthRuntime } = await import("@chenrun/auth");
  const authRuntime = getServerAuthRuntime();
  const factory = new CaslAbilityFactory(
    authRuntime.tenantContextRepository,
    procurementCatalog,
  );

  const prismaAbility = (await factory.createPrismaAbilityForTenant(
    tenantCtx,
    topology,
  )) as AppPrismaAbility<ProcurementAction, "PurchaseOrder">;

  // 4. 查询当前用户在当前租户数据库中的采购订单
  const orderService = new ProcurementOrderService();
  const orders = await orderService.listOrders(
    tenantPrisma,
    prismaAbility,
    tenantCtx.user.id,
  );

  // 5. 提取实时下推条件与权限状态
  const sqlWhere = getAccessibleWhere(prismaAbility, ProcurementSubject, "read");
  const canCreate = prismaAbility.can("create", ProcurementSubject);
  const canAuditGlobal = prismaAbility.can("audit", ProcurementSubject);
  const canExport = prismaAbility.can("export", ProcurementSubject);
  const isCostPriceVisible = prismaAbility.can("read", ProcurementSubject, "costPrice");

  let departmentName: string | null = null;
  if (topology.departmentId) {
    const dept = await tenantPrisma.department.findUnique({
      where: { id: topology.departmentId },
      select: { name: true },
    });
    departmentName = dept?.name ?? topology.departmentId;
  }

  return (
    <ProcurementOrderCenter
      orders={orders}
      sqlWhere={sqlWhere}
      activeOrgId={tenantCtx.organizationId}
      departmentName={departmentName}
      canCreate={canCreate}
      canAuditGlobal={canAuditGlobal}
      canExport={canExport}
      isCostPriceVisible={isCostPriceVisible}
      currentUserId={tenantCtx.user.id}
      ability={prismaAbility}
    />
  );
}
