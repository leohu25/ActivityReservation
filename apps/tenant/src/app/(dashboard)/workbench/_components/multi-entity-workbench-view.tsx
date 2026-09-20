"use client";

import React from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  buttonVariants,
  cn,
  UiAbilityProvider,
} from "@base/ui";
import {
  TenantAbilityProvider,
  createAbilityFromSnapshot,
  type AbilitySnapshot,
} from "@base/authorization";
import {
  Building2,
  Users,
  Briefcase,
  Layers,
  Tags,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Plus,
  ArrowRight,
  Database,
  CheckCircle2,
} from "lucide-react";
import type { TenantSubjectPermissions } from "@/kernel/permissions";
import type { WorkbenchPageData } from "@/kernel";

export interface MultiEntityWorkbenchViewProps {
  readonly pageData: WorkbenchPageData;
  readonly permissions: Record<string, TenantSubjectPermissions>;
  readonly counts: {
    readonly department: number | null;
    readonly role: number | null;
    readonly customer: number | null;
    readonly category: number | null;
  };
  readonly tags: readonly {
    readonly id: string;
    readonly name: string;
    readonly color?: string | null;
  }[];
}

/**
 * 联合受控权限保护插槽 (支持 A 视图动作 + B 实体动作联合判定)
 */
function CompositeGuard({
  viewAction,
  entitySubject,
  entityAction = "read",
  permissions,
  children,
  fallbackTitle,
}: {
  readonly viewAction?: string;
  readonly entitySubject?: string;
  readonly entityAction?: string;
  readonly permissions: Record<string, TenantSubjectPermissions>;
  readonly children: React.ReactNode;
  readonly fallbackTitle?: string;
}) {
  const workbenchPerm = permissions["Workbench"];
  const hasViewPermission = viewAction
    ? Boolean(workbenchPerm?.actions.includes(viewAction))
    : true;

  const entityPerm = entitySubject ? permissions[entitySubject] : undefined;
  const hasEntityPermission = entitySubject
    ? Boolean(entityPerm?.actions.includes(entityAction))
    : true;

  const isAllowed = hasViewPermission && hasEntityPermission;

  if (!isAllowed) {
    if (!fallbackTitle) return null;
    const reason = !hasViewPermission
      ? `工作台视图权限受限 (Workbench:${viewAction})`
      : `实体数据权限未开放 (${entitySubject}:${entityAction})`;
    return (
      <Card className="border-border/60 bg-muted/20 shadow-xs flex flex-col justify-center items-center p-6 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
          <Lock className="size-5 text-muted-foreground/80" />
        </div>
        <h4 className="text-sm font-semibold text-muted-foreground">{fallbackTitle}</h4>
        <p className="text-xs text-muted-foreground/70 mt-1 max-w-[220px]">
          {reason}
        </p>
      </Card>
    );
  }

  return <>{children}</>;
}

export function MultiEntityWorkbenchView({
  pageData,
  permissions,
  counts,
  tags,
}: MultiEntityWorkbenchViewProps) {
  // 构建客户端 CASL Ability 实例供 UI 组件树消费
  const snapshots: AbilitySnapshot[] = React.useMemo(() => {
    return Object.entries(permissions).map(([subject, perm]) => ({
      subject,
      actions: perm.actions,
      fieldPolicies: perm.fieldPolicies,
    }));
  }, [permissions]);

  const ability = React.useMemo(() => {
    return createAbilityFromSnapshot(snapshots);
  }, [snapshots]);

  const orgName = pageData.kind === "authenticated" ? pageData.org.name : "ERP 租户控制台";
  const orgSlug = pageData.kind === "authenticated" ? pageData.org.slug : "-";
  const employeeProfile = pageData.kind === "authenticated" ? pageData.profile : null;

  return (
    <TenantAbilityProvider snapshots={snapshots}>
      <UiAbilityProvider ability={ability}>
        <div className="flex flex-col gap-5">
          {/* 1. 顶部工作台上下文与身份信息条 */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-lg border border-border/70 bg-card p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Database className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    {orgName}
                  </h2>
                  <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                    {orgSlug}
                  </Badge>
                  <Badge variant="secondary" className="text-xs gap-1">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    多实体权限沙盒
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  当前工作台汇聚跨切片多实体数据，用于全面检验同一页面下 CASL 权限隔离与容灾表现。
                </p>
              </div>
            </div>

            {employeeProfile ? (
              <div className="flex items-center gap-3 self-end md:self-auto text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-md border border-border/50">
                <div className="flex items-center gap-1.5">
                  <span className="text-foreground font-medium">{employeeProfile.nameSnapshot}</span>
                  <span className="text-muted-foreground/60">·</span>
                  <span>{employeeProfile.department?.name ?? "未分配部门"}</span>
                  <span className="text-muted-foreground/60">·</span>
                  <span>{employeeProfile.position?.name ?? employeeProfile.jobTitle ?? "职员"}</span>
                </div>
              </div>
            ) : null}
          </div>

          {/* 2. 统计卡片栅格（多实体聚合：部门、角色、客户、分类） */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                多实体统计概览 (受控于各自实体的 Read 权限)
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* 实体 1: 部门统计 (联合受控: view_dept_stats + Department:read) */}
              <CompositeGuard
                viewAction="view_dept_stats"
                entitySubject="Department"
                entityAction="read"
                permissions={permissions}
                fallbackTitle="部门统计"
              >
                <Card className="border-border/70 bg-card shadow-xs transition-colors hover:border-primary/40">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">部门总数</CardTitle>
                    <Building2 className="size-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tracking-tight text-foreground">
                      {counts.department ?? "—"}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>实体: Department</span>
                      <Link href="/organization/departments" className="flex items-center gap-0.5 text-primary hover:underline">
                        <span>查看架构</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </CompositeGuard>

              {/* 实体 2: 角色统计 (联合受控: view_role_stats + Role:read) */}
              <CompositeGuard
                viewAction="view_role_stats"
                entitySubject="Role"
                entityAction="read"
                permissions={permissions}
                fallbackTitle="角色统计"
              >
                <Card className="border-border/70 bg-card shadow-xs transition-colors hover:border-primary/40">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">角色总数</CardTitle>
                    <Users className="size-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tracking-tight text-foreground">
                      {counts.role ?? "—"}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>实体: Role</span>
                      <Link href="/organization/roles" className="flex items-center gap-0.5 text-primary hover:underline">
                        <span>查看角色</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </CompositeGuard>

              {/* 实体 3: 客户档案统计 (联合受控: view_customer_stats + Customer:read) */}
              <CompositeGuard
                viewAction="view_customer_stats"
                entitySubject="Customer"
                entityAction="read"
                permissions={permissions}
                fallbackTitle="客户档案统计"
              >
                <Card className="border-border/70 bg-card shadow-xs transition-colors hover:border-primary/40">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">客户档案总数</CardTitle>
                    <Briefcase className="size-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tracking-tight text-foreground">
                      {counts.customer ?? "—"}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>实体: Customer</span>
                      <Link href="/customer/customers" className="flex items-center gap-0.5 text-primary hover:underline">
                        <span>客户中心</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </CompositeGuard>

              {/* 实体 4: 客户分类统计 (联合受控: view_category_stats + CustomerCategory:read) */}
              <CompositeGuard
                viewAction="view_category_stats"
                entitySubject="CustomerCategory"
                entityAction="read"
                permissions={permissions}
                fallbackTitle="客户分类统计"
              >
                <Card className="border-border/70 bg-card shadow-xs transition-colors hover:border-primary/40">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">客户分类总数</CardTitle>
                    <Layers className="size-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tracking-tight text-foreground">
                      {counts.category ?? "—"}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>实体: CustomerCategory</span>
                      <Link href="/customer/categories" className="flex items-center gap-0.5 text-primary hover:underline">
                        <span>分类管理</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </CompositeGuard>
            </div>
          </div>

          {/* 3. 中间区域：实体 5 (客户标签列表) + 快捷受控操作区 */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* 实体 5: 客户标签列表卡片 (联合受控: view_tags + CustomerTag:read) */}
            <div className="lg:col-span-2">
              <CompositeGuard
                viewAction="view_tags"
                entitySubject="CustomerTag"
                entityAction="read"
                permissions={permissions}
                fallbackTitle="客户标签库"
              >
                <Card className="border-border/70 bg-card shadow-xs h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tags className="size-4 text-primary" />
                        <CardTitle className="text-sm font-semibold">客户标签库 (CustomerTag)</CardTitle>
                      </div>
                      <Link href="/customer/tags" className="text-xs text-primary hover:underline flex items-center gap-1">
                        <span>标签管理</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </div>
                    <CardDescription className="text-xs">
                      此列表受控于 Workbench:view_tags 视图动作与 CustomerTag:read 数据实体权限。
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-muted/60 border border-border/70 text-foreground"
                          >
                            <span
                              className="size-2 rounded-full shrink-0"
                              style={{ backgroundColor: tag.color ?? "#94a3b8" }}
                            />
                            <span>{tag.name}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        暂无标签数据
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CompositeGuard>
            </div>

            {/* 写权限受控测试区 (联合受控: quick_action + 目标实体的 create) */}
            <div>
              <Card className="border-border/70 bg-card shadow-xs h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="size-4 text-amber-500" />
                    <CardTitle className="text-sm font-semibold">快捷操作与写权限测试</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    受控于 Workbench:quick_action 视图权限及各实体的 Create 写操作权限。
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2.5">
                  <CompositeGuard viewAction="quick_action" entitySubject="Customer" entityAction="create" permissions={permissions}>
                    <Link
                      href="/customer/customers"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-start gap-2 text-xs")}
                    >
                      <Plus className="size-3.5 text-primary" />
                      <span>新建客户档案 (Customer:create)</span>
                    </Link>
                  </CompositeGuard>

                  <CompositeGuard viewAction="quick_action" entitySubject="Department" entityAction="create" permissions={permissions}>
                    <Link
                      href="/organization/departments"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-start gap-2 text-xs")}
                    >
                      <Plus className="size-3.5 text-blue-500" />
                      <span>新建部门节点 (Department:create)</span>
                    </Link>
                  </CompositeGuard>

                  <CompositeGuard viewAction="quick_action" entitySubject="Role" entityAction="create" permissions={permissions}>
                    <Link
                      href="/organization/roles"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-start gap-2 text-xs")}
                    >
                      <Plus className="size-3.5 text-purple-500" />
                      <span>新建系统角色 (Role:create)</span>
                    </Link>
                  </CompositeGuard>

                  <CompositeGuard viewAction="quick_action" entitySubject="CustomerTag" entityAction="create" permissions={permissions}>
                    <Link
                      href="/customer/tags"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-start gap-2 text-xs")}
                    >
                      <Plus className="size-3.5 text-emerald-500" />
                      <span>新建客户标签 (CustomerTag:create)</span>
                    </Link>
                  </CompositeGuard>

                  <div className="mt-2 rounded-md bg-muted/40 p-2.5 text-[11px] text-muted-foreground border border-border/40">
                    💡 提示：若未勾选 Workbench:quick_action 或被剥夺目标实体的 create 动作，对应按钮将安全移除。
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </UiAbilityProvider>
    </TenantAbilityProvider>
  );
}
