import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Input,
  Button,
  AuthorizedField,
} from "@chenrun/ui";
import {
  Building2,
  Database,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  Code2,
  SlidersHorizontal,
  CheckCircle2,
  Users,
  Briefcase,
  GitFork,
  AlertCircle,
  ShieldCheck,
  Check,
  X,
  Building,
} from "lucide-react";
import type {
  WorkbenchPageData,
  WorkbenchDataDTO,
  EmployeeProfileDTO,
} from "../types";

/**
 * 租户会话未激活提示卡片
 */
export function TenantUnauthenticatedCard({
  message,
  isNoOrg,
}: {
  readonly message: string;
  readonly isNoOrg: boolean;
}) {
  return (
    <Card className="border-amber-200 bg-amber-50/50 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
          <ShieldAlert className="size-5 text-amber-600" />
          <span>
            {isNoOrg ? "尚未选择或激活任何 ERP 租户组织" : "租户会话未激活"}
          </span>
        </CardTitle>
        <CardDescription className="text-amber-700 dark:text-amber-300">
          晨润 ERP 采用严格的 Database-per-Tenant 物理隔离机制。
          {isNoOrg ? "请在顶部导航栏组织切换器中选择或创建企业租户。" : message}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

/**
 * 租户业务准入受限拦截卡片
 */
export function TenantAccessBlockedCard({
  message,
  status,
}: {
  readonly message: string;
  readonly status?: string;
}) {
  return (
    <div className="space-y-6">
      <Card className="border-rose-200 bg-rose-50/60 p-6 shadow-xs dark:border-rose-900/50 dark:bg-rose-950/30">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-rose-100 p-2.5 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
            <AlertCircle className="size-6 shrink-0" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-rose-900 dark:text-rose-200">
                租户业务系统准入受限 (Tenant Access Gate Blocked)
              </h2>
              <Badge variant="destructive" size="sm">
                {status ?? "NO_PROFILE"}
              </Badge>
            </div>
            <p className="text-sm text-rose-700 dark:text-rose-300">
              {message}
            </p>
            <p className="text-xs text-rose-600/80 dark:text-rose-400/80">
              当租户内员工档案处于停用或离职状态时，系统将暂停当前账号在当前企业的业务访问权限。您仍可在其他正常租户中使用平台账号。
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * 顶部租户状态与当前账号信息横幅
 */
export function WorkbenchHeaderBanner({
  orgName,
  orgSlug,
  userName,
  userRole,
  authVersion,
}: {
  readonly orgName: string;
  readonly orgSlug: string;
  readonly userName: string;
  readonly userRole: string;
  readonly authVersion: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Building2 className="size-3.5" />
            <span>PostgreSQL 租户独立物理库动态连接就绪</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {orgName}
          </h1>

          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
            <span>组织标识:</span>
            <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-200 font-semibold">
              {orgSlug}
            </code>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <UserCheck className="size-3.5 text-slate-400" />
            <span>当前用户:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {userName}
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>系统角色:</span>
            <Badge variant="process" size="sm">
              {userRole}
            </Badge>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>权限版本:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              v{authVersion}
            </span>
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
  );
}

/**
 * 员工档案与组织关系四指标栅格
 */
export function EmployeeProfileMetricsGrid({
  profile,
  fallbackName,
  treeCount,
}: {
  readonly profile: EmployeeProfileDTO | null;
  readonly fallbackName: string;
  readonly treeCount: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <Users className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">
              员工档案编号
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {profile?.employeeNo || "未分配工号"}
            </div>
            <div className="text-[11px] text-slate-500">
              {profile?.nameSnapshot || fallbackName || "在职档案"}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
            <Building className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">
              所属组织部门
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {profile?.department?.name || "未分配部门"}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {profile?.department?.code
                ? `编码: ${profile.department.code}`
                : "未关联拓扑节点"}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Briefcase className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">
              岗位职务 (Position)
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {profile?.position?.name || profile?.jobTitle || "企业成员"}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              行政岗位
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <GitFork className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">
              数据管辖范围
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {treeCount > 0 ? `${treeCount} 个部门节点` : "个人范围 / 无部门"}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              实时数据范围
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * 四层权限下推与字段策略展示
 */
export function PermissionAnalysisPanels({
  sqlWhere,
  fieldModes,
  canReadOrder,
  canCreateOrder,
  canAuditOrder,
  canExportOrder,
}: {
  readonly sqlWhere: unknown;
  readonly fieldModes: WorkbenchDataDTO["fieldModes"];
  readonly canReadOrder: boolean;
  readonly canCreateOrder: boolean;
  readonly canAuditOrder: boolean;
  readonly canExportOrder: boolean;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
              <Database className="size-4 text-blue-600" />
              <span>数据库数据下推 (Prisma accessibleBy)</span>
            </CardTitle>
            <Badge variant="success" size="sm">
              <CheckCircle2 className="size-3" />
              <span>实时计算生效</span>
            </Badge>
          </div>
          <CardDescription>
            由当前登录员工档案部门拓扑与 CASL 角色规则动态编译生成的 Prisma
            Where 查询条件：
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative rounded-xl bg-slate-900 p-4 font-mono text-xs text-emerald-400 shadow-inner overflow-x-auto dark:bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Code2 className="size-3" />
                <span>CASL Prisma Where Clause</span>
              </span>
              <span>编译结果</span>
            </div>
            <pre className="leading-relaxed">
              {JSON.stringify(sqlWhere, null, 2)}
            </pre>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-blue-600" />
              <span>采购中心功能权限断言状态</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                {canReadOrder ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <X className="size-3.5 text-rose-500" />
                )}
                <span className="text-slate-600 dark:text-slate-400">
                  查看单据
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {canCreateOrder ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <X className="size-3.5 text-rose-500" />
                )}
                <span className="text-slate-600 dark:text-slate-400">
                  新建采购
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {canAuditOrder ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <X className="size-3.5 text-rose-500" />
                )}
                <span className="text-slate-600 dark:text-slate-400">
                  单据审核
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {canExportOrder ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <X className="size-3.5 text-rose-500" />
                )}
                <span className="text-slate-600 dark:text-slate-400">
                  数据导出
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
              <SlidersHorizontal className="size-4 text-blue-600" />
              <span>字段策略三态保护 (AuthorizedField 自动感知)</span>
            </CardTitle>
            <Badge variant="default" size="sm">
              CASL 实时推导生效
            </Badge>
          </div>
          <CardDescription>
            根据当前角色的字段策略，受控字段自动匹配可编辑 (EDITABLE)、只读
            (READONLY) 或隐藏 (HIDDEN) 模式：
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AuthorizedField
            mode={fieldModes.supplierName}
            subject="PurchaseOrder"
            field="supplierName"
            label="供应商全称 (supplierName)"
          >
            <Input defaultValue="晨润精密设备供应链有限公司" />
          </AuthorizedField>

          <AuthorizedField
            mode={fieldModes.costPrice}
            subject="PurchaseOrder"
            field="costPrice"
            label="采购成本价 (costPrice)"
            fallback={
              <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50/60 p-3 text-xs text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400">
                🔒 采购成本价属于敏感字段，当前角色无查看权限
              </div>
            }
          >
            <Input
              defaultValue="¥ 246,800.00"
              className="font-semibold text-emerald-600 tabular-nums dark:text-emerald-400"
            />
          </AuthorizedField>

          <AuthorizedField
            mode={fieldModes.quantity}
            subject="PurchaseOrder"
            field="quantity"
            label="采购批次数量 (quantity)"
          >
            <Input defaultValue="1,200" />
          </AuthorizedField>

          <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-50/80 p-3 rounded-xl dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            💡 字段策略与角色直接绑定。管理员在【系统管理 /
            角色与权限】中调整字段策略后，页面将自动响应隐藏、只读或编辑模式。
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export interface WorkbenchViewProps {
  readonly data: WorkbenchPageData;
}

/**
 * 租户工作台整体视图组件（无底层直连与 CASL 编译，纯渲染装配）
 */
export function WorkbenchView({ data }: WorkbenchViewProps) {
  if (data.kind === "unauthenticated") {
    return (
      <TenantUnauthenticatedCard
        message={data.message}
        isNoOrg={data.isNoOrg}
      />
    );
  }

  if (data.kind === "blocked") {
    return (
      <TenantAccessBlockedCard message={data.message} status={data.status} />
    );
  }

  return (
    <div className="space-y-6">
      <WorkbenchHeaderBanner
        orgName={data.org.name}
        orgSlug={data.org.slug}
        userName={data.user.name}
        userRole={data.user.role}
        authVersion={data.org.authorizationVersion}
      />

      <EmployeeProfileMetricsGrid
        profile={data.profile}
        fallbackName={data.user.name}
        treeCount={data.treeCount}
      />

      <PermissionAnalysisPanels
        sqlWhere={data.sqlWhere}
        fieldModes={data.fieldModes}
        canReadOrder={data.permissions.canReadOrder}
        canCreateOrder={data.permissions.canCreateOrder}
        canAuditOrder={data.permissions.canAuditOrder}
        canExportOrder={data.permissions.canExportOrder}
      />
    </div>
  );
}
