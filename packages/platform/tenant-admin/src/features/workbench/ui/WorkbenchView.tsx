import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
} from "@base/ui";
import {
  Building2,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Users,
  Briefcase,
  AlertCircle,
  ShieldCheck,
  Building,
  KeyRound,
  FileCheck,
  GitFork,
} from "lucide-react";
import type {
  WorkbenchPageData,
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
            {isNoOrg ? "尚未选择或激活任何企业租户组织" : "租户会话未激活"}
          </span>
        </CardTitle>
        <CardDescription className="text-amber-700 dark:text-amber-300">
          本系统采用严格的 Database-per-Tenant 物理隔离机制。
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

        <Link href="/organization/employees">
          <Button
            variant="default"
            size="lg"
            className="group rounded-xl font-bold shadow-sm shadow-blue-600/20"
          >
            <span>进入组织管理</span>
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
              {profile?.name || fallbackName || "在职档案"}
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
 * 系统基础设施与系统管理指引面板（保持平台套件 100% 纯净，零业务实体硬编码）
 */
export function SystemOverviewPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
              <ShieldCheck className="size-4 text-blue-600" />
              <span>多租户基座与权限闭环 (Tenant Platform Infrastructure)</span>
            </CardTitle>
            <Badge variant="success" size="sm">
              <CheckCircle2 className="size-3" />
              <span>正常运行</span>
            </Badge>
          </div>
          <CardDescription>
            租户运行于物理隔离的独立数据库，所有数据操作受控于 CASL 四层权限模型与部门拓扑下推。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
            <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Building2 className="size-3.5 text-blue-600" />
              <span>Database-per-Tenant 隔离</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              当前租户的数据存储于独立的 PostgreSQL 物理库，由平台动态连接池统一管理，物理杜绝跨租户数据泄露。
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
            <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              <span>四层权限闭环 (CASL Engine)</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              功能权限 (Action)、数据范围 (Data Scope)、字段脱敏 (Field Policy) 与准入门禁严格在服务端与数据库下推层执行。
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
              <KeyRound className="size-4 text-indigo-600" />
              <span>系统设置与快捷通道</span>
            </CardTitle>
            <Badge variant="default" size="sm">
              管理套件
            </Badge>
          </div>
          <CardDescription>
            快速进入组织架构维护、角色权限分配及审计安全日志中心：
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/organization/departments"
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 transition-colors"
            >
              <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <Building className="size-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  部门架构
                </div>
                <div className="text-[11px] text-slate-400">维护层级与汇报线</div>
              </div>
            </Link>

            <Link
              href="/settings/roles"
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 transition-colors"
            >
              <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <KeyRound className="size-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  角色权限
                </div>
                <div className="text-[11px] text-slate-400">配置四层权限规则</div>
              </div>
            </Link>

            <Link
              href="/organization/employees"
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 transition-colors"
            >
              <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Users className="size-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  员工档案
                </div>
                <div className="text-[11px] text-slate-400">入职与岗位调度</div>
              </div>
            </Link>

            <Link
              href="/audit/login"
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 transition-colors"
            >
              <div className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <FileCheck className="size-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  安全审计
                </div>
                <div className="text-[11px] text-slate-400">追踪登录与操作记录</div>
              </div>
            </Link>
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
 * 租户工作台整体视图组件（系统平台纯净视图）
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

      <SystemOverviewPanel />
    </div>
  );
}
