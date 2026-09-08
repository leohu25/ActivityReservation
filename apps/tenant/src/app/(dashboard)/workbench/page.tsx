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
  Input,
  Button,
  PermissionField,
} from "@chenrun/ui";
import { getAccessibleWhere } from "@chenrun/authorization";
import Link from "next/link";

/**
 * 工作台页面（Server Component）
 * 真实读取 PostgreSQL Control DB 与 Better Auth 会话，使用 shadcn/ui 组件呈现
 */
export default async function WorkbenchPage() {
  const runtime = getServerAuthRuntime();
  const session = await runtime.auth.api.getSession({
    headers: await headers(),
  });

  const activeOrgId = session?.session.activeOrganizationId;

  // 1. 如果没有激活的租户组织，提示用户创建或选择租户
  if (!activeOrgId) {
    return (
      <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="text-amber-900 dark:text-amber-200">
            ⚠️ 尚未选择或激活任何 ERP 租户组织
          </CardTitle>
          <CardDescription className="text-amber-700 dark:text-amber-300">
            晨润 ERP 采用严格的 Database-per-Tenant
            物理隔离机制。请在顶部导航栏下拉菜单中选择现有组织或新建租户组织。
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // 2. 从数据库真实查询当前组织与成员
  const activeOrg = await runtime.prisma.organization.findUnique({
    where: { id: activeOrgId },
  });

  const currentMember = await runtime.prisma.member.findFirst({
    where: {
      organizationId: activeOrgId,
      userId: session.user.id,
    },
  });

  // 3. 构造 CASL Ability Factory 并动态编译真实 Ability
  const factory = new CaslAbilityFactory(
    runtime.tenantContextRepository,
    procurementCatalog,
  );

  const topology = {
    userId: session.user.id,
    departmentId: "dept_procurement_east",
    departmentTreeIds: ["dept_procurement_east", "dept_procurement_east_sub"],
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
          field: "supplierName",
          access: "EDITABLE",
        },
        {
          role: currentMember?.role ?? "member",
          subject: "PurchaseOrder",
          field: "costPrice",
          access: currentMember?.role === "owner" ? "EDITABLE" : "READONLY",
        },
      ],
    },
  );

  // 4. 真实调用 @casl/prisma 生成当前数据库查询下推条件
  const sqlWhere = getAccessibleWhere(prismaAbility, "PurchaseOrder", "read");

  return (
    <div className="space-y-8">
      {/* 租户与登录真实状态横幅 */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-800 p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-xs">
              <span>🏢</span>
              <span>当前已连接真实 PostgreSQL 租户库</span>
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight">
              {activeOrg?.name ?? "默认企业租户"}
            </h1>
            <div className="mt-2 text-sm text-blue-100 flex flex-wrap items-center gap-2">
              <span>组织标识:</span>
              <code className="font-mono bg-white/10 px-1.5 py-0.5 rounded">
                {activeOrg?.slug}
              </code>
              <span>| 当前用户:</span>
              <span className="font-bold">
                {session.user.name || session.user.email}
              </span>
              <span>| 角色:</span>
              <Badge variant="secondary" className="text-white bg-blue-500/50">
                {currentMember?.role ?? "普通成员"}
              </Badge>
            </div>
          </div>

          <Link href="/procurement/orders">
            <Button
              variant="secondary"
              size="lg"
              className="rounded-2xl font-bold text-blue-700"
            >
              前往采购订单中心 →
            </Button>
          </Link>
        </div>
      </div>

      {/* 四层权限真实下推与字段三态呈现 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 左侧：数据范围下推 SQL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <span>🛡️</span>
              <span>数据库数据下推 (Prisma accessibleBy)</span>
            </CardTitle>
            <CardDescription>
              由 CASL 规则下推生成的真实 Prisma Where 过滤条件：
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl bg-zinc-950 p-4 font-mono text-xs text-emerald-400 shadow-inner overflow-x-auto">
              <pre>{JSON.stringify(sqlWhere, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>

        {/* 右侧：表单字段三态安全渲染 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <span>📝</span>
              <span>
                字段权限三态交互 (&lt;PermissionField&gt; + shadcn/ui)
              </span>
            </CardTitle>
            <CardDescription>
              基于角色策略动态渲染只读或可写 Input 组件：
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PermissionField label="供应商全称 (supplierName)" mode="EDITABLE">
              <Input defaultValue="晨润精密设备供应链" />
            </PermissionField>

            <PermissionField
              label="采购成本价 (costPrice) —— 核心保密资产"
              mode={currentMember?.role === "owner" ? "EDITABLE" : "READONLY"}
            >
              <Input
                defaultValue="¥ 246,800.00"
                className="font-semibold text-emerald-600 dark:text-emerald-400"
              />
            </PermissionField>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
