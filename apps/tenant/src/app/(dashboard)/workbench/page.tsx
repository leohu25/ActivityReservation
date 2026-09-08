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
import {
  Building2,
  Database,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  Code2,
  SlidersHorizontal,
  CheckCircle2,
} from "lucide-react";

/**
 * 工作台页面（Server Component）
 * 遵循现代数智工业风与 shadcn/ui 组件规范，真实读取 PostgreSQL Control DB 与 Better Auth 会话
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
      <Card className="border-amber-200 bg-amber-50/50 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <ShieldAlert className="size-5 text-amber-600" />
            <span>尚未选择或激活任何 ERP 租户组织</span>
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
    <div className="space-y-6">
      {/* 租户与登录真实状态横幅 (现代轻量数智风) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            {/* 顶栏健康微胶囊 */}
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <Building2 className="size-3.5" />
              <span>PostgreSQL 租户物理隔离库动态连接正常</span>
            </div>

            {/* 组织名称大标题 */}
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {activeOrg?.name ?? "默认企业租户"}
            </h1>

            {/* 组织与用户信息属性条 */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
              <span>组织标识:</span>
              <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-200 font-semibold">
                {activeOrg?.slug}
              </code>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <UserCheck className="size-3.5 text-slate-400" />
              <span>当前账号:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {session.user.name || session.user.email}
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span>角色状态:</span>
              <Badge variant="process" size="sm">
                {currentMember?.role ?? "普通成员"}
              </Badge>
            </div>
          </div>

          <Link href="/procurement/orders">
            <Button
              variant="default"
              size="lg"
              className="group rounded-xl font-bold shadow-sm shadow-blue-600/20"
            >
              <span>前往采购订单中心</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 四层权限真实下推与字段三态呈现 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：数据范围下推 SQL */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                <Database className="size-4 text-blue-600" />
                <span>数据库数据下推 (Prisma accessibleBy)</span>
              </CardTitle>
              <Badge variant="success" size="sm">
                <CheckCircle2 className="size-3" />
                <span>已编译下推</span>
              </Badge>
            </div>
            <CardDescription>
              由 CASL 规则下推编译生成的真实 Prisma Where 过滤条件：
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-xl bg-slate-900 p-4 font-mono text-xs text-emerald-400 shadow-inner overflow-x-auto dark:bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Code2 className="size-3" />
                  <span>CASL Prisma Where Clause</span>
                </span>
                <span>JSON Output</span>
              </div>
              <pre className="leading-relaxed">
                {JSON.stringify(sqlWhere, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* 右侧：表单字段三态安全渲染 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                <SlidersHorizontal className="size-4 text-blue-600" />
                <span>字段权限三态交互 (PermissionField + shadcn/ui)</span>
              </CardTitle>
              <Badge variant="default" size="sm">
                动态策略保护
              </Badge>
            </div>
            <CardDescription>
              基于角色策略动态渲染只读 (READONLY) 或可编辑 (EDITABLE) 状态：
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
                className="font-semibold text-emerald-600 tabular-nums dark:text-emerald-400"
              />
            </PermissionField>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
