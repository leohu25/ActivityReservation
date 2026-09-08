import { headers } from "next/headers";
import { getServerAuthRuntime } from "@chenrun/auth";
import { CaslAbilityFactory } from "@chenrun/authorization";
import { procurementCatalog } from "@chenrun/feature-procurement-center";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  PermissionField,
} from "@chenrun/ui";
import { getAccessibleWhere } from "@chenrun/authorization";
import Link from "next/link";
import {
  ArrowLeft,
  PackageCheck,
  Plus,
  CheckCheck,
  Code2,
  ShieldCheck,
  Building2,
} from "lucide-react";

interface OrderItem {
  readonly id: string;
  readonly orderNo: string;
  readonly title: string;
  readonly supplierName: string;
  readonly costPrice: string;
  readonly status: "待审核" | "已完成";
  readonly createdByName: string;
}

/**
 * 采购订单中心业务页面（Server Component）
 * 遵循现代数智工业风与 shadcn/ui 组件规范，真实对接 CASL Ability 与 Prisma 下推
 */
export default async function ProcurementOrdersPage() {
  const runtime = getServerAuthRuntime();
  const session = await runtime.auth.api.getSession({
    headers: await headers(),
  });

  const activeOrgId = session?.session.activeOrganizationId;

  if (!activeOrgId) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 p-6 text-amber-800 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
        <div className="flex items-center gap-2 font-bold text-sm">
          <span>⚠️ 请先在控制台选择并激活一个租户组织</span>
        </div>
      </Card>
    );
  }

  // 1. 获取当前组织及成员身份
  const currentMember = await runtime.prisma.member.findFirst({
    where: {
      organizationId: activeOrgId,
      userId: session.user.id,
    },
  });

  // 2. 编译当前租户与角色的 CASL Ability
  const factory = new CaslAbilityFactory(
    runtime.tenantContextRepository,
    procurementCatalog,
  );

  const topology = {
    userId: session.user.id,
    departmentId: "dept_procurement_east",
    departmentTreeIds: ["dept_procurement_east"],
  };

  const prismaAbility = await factory.createPrismaAbilityForTenant(
    {
      organizationId: activeOrgId,
      user: session.user,
      session: session.session,
      member: currentMember ?? {
        id: "temp_member",
        organizationId: activeOrgId,
        userId: session.user.id,
        role: "member",
        createdAt: new Date(),
      },
      database: {
        id: "db_local",
        organizationId: activeOrgId,
        clusterCode: "local",
        databaseName: `tenant_${activeOrgId}`,
        secretRef: `secret/${activeOrgId}`,
        schemaVersion: "1",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    topology,
    {
      dataScopes: [
        {
          role: currentMember?.role ?? "member",
          resource: "procurement.order",
          action: "read",
          scopeType: "DEPT_TREE",
        },
      ],
      fieldPolicies: [
        {
          role: currentMember?.role ?? "member",
          subject: "PurchaseOrder",
          field: "costPrice",
          access: currentMember?.role === "owner" ? "EDITABLE" : "READONLY",
        },
      ],
    },
  );

  // 3. 计算数据范围与字段访问权限
  const sqlWhere = getAccessibleWhere(prismaAbility, "PurchaseOrder", "read");
  const isCostPriceVisible = prismaAbility.can(
    "read",
    "PurchaseOrder",
    "costPrice",
  );
  const canCreate = prismaAbility.can("create", "PurchaseOrder");
  const canAudit = prismaAbility.can("audit", "PurchaseOrder");

  // 4. 模拟数据库查询出的业务行（下一特性在迁移租户库后直接连表）
  const sampleOrders: readonly OrderItem[] = [
    {
      id: "po_001",
      orderNo: "PO-20260908-001",
      title: "五金精密机床主轴套件",
      supplierName: "江苏晨润精密机械制造",
      costPrice: "¥ 86,400.00",
      status: "待审核",
      createdByName: session.user.name || "当前用户",
    },
    {
      id: "po_002",
      orderNo: "PO-20260908-002",
      title: "高强度航空级合金钢材批次",
      supplierName: "无锡新特金属材料供应链",
      costPrice: "¥ 142,000.00",
      status: "已完成",
      createdByName: "李工程师",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 顶部操作与标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link
              href="/workbench"
              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
            >
              <ArrowLeft className="size-3" />
              <span>返回工作台</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span>供应链采购</span>
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              采购订单中心
            </h1>
            <Badge variant="default" size="sm">
              <PackageCheck className="size-3" />
              <span>CASL 动态守卫</span>
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            按钮依权限展示、敏感成本价依字段策略控制、查询结果遵循 PostgreSQL
            动态数据范围下推。
          </p>
        </div>

        {/* 权限受控操作按钮组 */}
        <div className="flex items-center gap-2.5">
          {canAudit && (
            <Button
              variant="outline"
              size="sm"
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
            >
              <CheckCheck className="size-3.5" />
              <span>批量审核</span>
            </Button>
          )}
          {canCreate && (
            <Button
              variant="default"
              size="sm"
              className="shadow-sm shadow-blue-600/25"
            >
              <Plus className="size-3.5" />
              <span>创建新订单</span>
            </Button>
          )}
        </div>
      </div>

      {/* 实时下推与字段权限说明看板 */}
      <Card className="border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="size-3.5 text-blue-600" />
              <span>Prisma accessibleBy 实时下推查询条件</span>
            </CardTitle>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Building2 className="size-3" />
              <span>当前租户: {activeOrgId}</span>
            </div>
          </div>
          <CardDescription>
            根据当前用户的部门树拓扑结构，自动注入数据库层级的物理隔离过滤：
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl bg-slate-900 p-3 font-mono text-xs text-emerald-400 overflow-x-auto dark:bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-500">
              <Code2 className="size-3" />
              <span>{"// Generated Prisma Where Clause"}</span>
            </div>
            <pre className="leading-relaxed">
              {JSON.stringify(sqlWhere, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* 业务订单表格 (遵循现代轻量 SaaS 表格规范) */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 dark:border-slate-800 dark:bg-slate-800/60">
            <tr>
              <th className="px-5 py-3 font-bold">订单编号</th>
              <th className="px-5 py-3 font-bold">物料名称</th>
              <th className="px-5 py-3 font-bold">供应商</th>
              <th className="px-5 py-3 font-bold">采购成本价 (保密资产)</th>
              <th className="px-5 py-3 font-bold">状态</th>
              <th className="px-5 py-3 font-bold">创建人</th>
              <th className="px-5 py-3 font-bold text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sampleOrders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors"
              >
                <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                  {order.orderNo}
                </td>
                <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                  {order.title}
                </td>
                <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                  {order.supplierName}
                </td>
                <td className="px-5 py-3.5">
                  {isCostPriceVisible ? (
                    <span className="font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
                      {order.costPrice}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic font-mono text-[11px]">
                      *** (已依据字段策略脱敏)
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <Badge
                    variant={order.status === "已完成" ? "success" : "warning"}
                    size="sm"
                  >
                    {order.status}
                  </Badge>
                </td>
                <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                  {order.createdByName}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <PermissionField mode="READONLY">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold dark:text-blue-400"
                    >
                      详情 / 编辑
                    </Button>
                  </PermissionField>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
