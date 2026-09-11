"use client";

import React, { useState, useTransition } from "react";
import {
  Shield,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  UserCheck,
  PackageCheck,
  Users,
  Settings,
  ShieldCheck,
  FileText,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Input,
} from "@chenrun/ui";
import {
  DataScope,
  FieldPolicy,
  StandardAction,
  resolveFieldAccess,
  type DataScopeType,
  type FieldAccessMode,
  type RolePermissionPayload,
} from "@chenrun/authorization";
import type { TenantRoleItem } from "../types";
import { CreateRoleModal } from "./CreateRoleModal";
import {
  saveRolePermissionsAction,
  deleteRoleAction,
  getSystemRoleDefaultsAction,
} from "../actions";
import {
  DATA_SCOPE_SELECT_OPTIONS,
  type ModulePermissionDescriptor,
  type PagePermissionDescriptor,
} from "../permission-registry";

export interface RolePermissionManagerProps {
  readonly initialRoles: readonly TenantRoleItem[];
  readonly activeOrgId: string;
  readonly permissionTree?: readonly ModulePermissionDescriptor[];
}

export function RolePermissionManager({
  initialRoles,
  permissionTree = [],
}: RolePermissionManagerProps) {
  // 过滤掉任何可能混入的 owner 角色（双重保护）
  const sanitizedInitialRoles = initialRoles.filter((r) => r.role !== "owner");
  const [roles, setRoles] = useState<TenantRoleItem[]>([
    ...sanitizedInitialRoles,
  ]);
  const [selectedRoleCode, setSelectedRoleCode] = useState(
    sanitizedInitialRoles[0]?.role || "admin",
  );
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // 模块展开/折叠状态：默认展开 permissionTree 中全部模块（由契约派生，禁止硬编码 moduleKey）
  const [expandedModules, setExpandedModules] = useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {};
    for (const mod of permissionTree) {
      initial[mod.moduleKey] = true;
    }
    return initial;
  });

  // 展开字段控制抽屉/面板的页面 resource
  const [expandedFieldPages, setExpandedFieldPages] = useState<
    Record<string, boolean>
  >({});

  // 新增角色模态框状态
  const [showCreateModal, setShowCreateModal] = useState(false);

  const selectedRole =
    roles.find((r) => r.role === selectedRoleCode) || roles[0];
  const isSystemRole = selectedRole?.isSystem ?? false;

  const toggleModuleExpand = (moduleKey: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleKey]: !prev[moduleKey],
    }));
  };

  const toggleFieldExpand = (resource: string) => {
    setExpandedFieldPages((prev) => ({
      ...prev,
      [resource]: !prev[resource],
    }));
  };

  // 角色权限变更辅助函数
  const updateSelectedRolePermissions = (
    nextPermissions: RolePermissionPayload,
  ) => {
    if (!selectedRole) return;
    setRoles((prev) =>
      prev.map((r) =>
        r.role === selectedRole.role
          ? { ...r, permissions: nextPermissions }
          : r,
      ),
    );
  };

  const isPageActionChecked = (resource: string, action: string): boolean => {
    if (!selectedRole) return false;
    const actions = selectedRole.permissions.statement[resource] ?? [];
    return actions.includes(action);
  };

  const getPageDataScope = (resource: string): DataScopeType => {
    if (!selectedRole) return DataScope.DEPT;
    const scope = selectedRole.permissions.dataScopes?.find(
      (s) => s.resource === resource && (!s.action || s.action === "read"),
    );
    return scope?.scopeType ?? DataScope.DEPT;
  };

  // --- 交互处理函数 ---

  // 1. 切换单个页面的指定操作 Action
  const handleTogglePageAction = (
    page: PagePermissionDescriptor,
    action: string,
  ) => {
    if (!selectedRole) return;
    const currentActions =
      selectedRole.permissions.statement[page.resource] ?? [];
    const exists = currentActions.includes(action);
    const nextActions = exists
      ? currentActions.filter((a) => a !== action)
      : [...currentActions, action];

    const nextStatement = {
      ...selectedRole.permissions.statement,
      [page.resource]: nextActions,
    };

    updateSelectedRolePermissions({
      ...selectedRole.permissions,
      statement: nextStatement,
    });
  };

  // 2. 切换整页全选/全不选
  const handleTogglePageAll = (page: PagePermissionDescriptor) => {
    if (!selectedRole) return;
    const currentActions =
      selectedRole.permissions.statement[page.resource] ?? [];
    const isAllChecked = page.actions.every((a) =>
      currentActions.includes(a.action),
    );

    const nextStatement = { ...selectedRole.permissions.statement };
    if (isAllChecked) {
      delete nextStatement[page.resource];
    } else {
      nextStatement[page.resource] = page.actions.map((a) => a.action);
    }

    updateSelectedRolePermissions({
      ...selectedRole.permissions,
      statement: nextStatement,
    });
  };

  // 3. 模块整组快捷全选/清空
  const handleToggleModuleAll = (mod: ModulePermissionDescriptor) => {
    if (!selectedRole) return;
    const nextStatement = { ...selectedRole.permissions.statement };
    const allPagesChecked = mod.pages.every((p) => {
      const actions = nextStatement[p.resource] ?? [];
      return p.actions.every((a) => actions.includes(a.action));
    });

    if (allPagesChecked) {
      // 模块全清空
      for (const p of mod.pages) {
        delete nextStatement[p.resource];
      }
    } else {
      // 模块全选
      for (const p of mod.pages) {
        nextStatement[p.resource] = p.actions.map((a) => a.action);
      }
    }

    updateSelectedRolePermissions({
      ...selectedRole.permissions,
      statement: nextStatement,
    });
  };

  // 4. 切换数据范围
  const handleDataScopeChange = (
    resource: string,
    nextScope: DataScopeType,
  ) => {
    if (!selectedRole) return;
    const existing = (selectedRole.permissions.dataScopes ?? []).filter(
      (s) => s.resource !== resource,
    );
    updateSelectedRolePermissions({
      ...selectedRole.permissions,
      dataScopes: [
        ...existing,
        {
          resource,
          action: "read",
          scopeType: nextScope,
        },
      ],
    });
  };

  // 5. 字段策略推导与修改（单一规则源：@chenrun/authorization resolveFieldAccess）
  const getFieldAccess = (
    subject: string,
    field: string,
    resource: string,
  ): FieldAccessMode => {
    const policies = selectedRole?.permissions.fieldPolicies ?? [];
    const found = policies.find(
      (p) => p.subject === subject && p.field === field,
    );
    if (found) return found.access;

    const statement = selectedRole?.permissions.statement[resource] ?? [];
    return resolveFieldAccess({
      hasRead: statement.includes(StandardAction.READ),
      hasWrite:
        statement.includes(StandardAction.CREATE) ||
        statement.includes(StandardAction.UPDATE),
    });
  };

  const handleToggleFieldAccess = (
    subject: string,
    field: string,
    resource: string,
    targetMode: "read" | "write",
  ) => {
    if (!selectedRole) return;
    const currentAccess = getFieldAccess(subject, field, resource);
    const policies = (selectedRole.permissions.fieldPolicies ?? []).filter(
      (p) => !(p.subject === subject && p.field === field),
    );

    if (targetMode === "read") {
      // 切换读状态 (HIDDEN <-> READONLY/EDITABLE)
      if (currentAccess === FieldPolicy.HIDDEN) {
        policies.push({
          subject,
          field,
          access: FieldPolicy.READONLY,
        });
      } else {
        policies.push({
          subject,
          field,
          access: FieldPolicy.HIDDEN,
        });
      }
    } else {
      // 切换写状态 (READONLY <-> EDITABLE)
      if (currentAccess === FieldPolicy.EDITABLE) {
        policies.push({
          subject,
          field,
          access: FieldPolicy.READONLY,
        });
      } else {
        policies.push({
          subject,
          field,
          access: FieldPolicy.EDITABLE,
        });
      }
    }

    updateSelectedRolePermissions({
      ...selectedRole.permissions,
      fieldPolicies: policies,
    });
  };

  // 6. 保存角色权限
  const handleSave = () => {
    if (!selectedRole) return;
    setNotification(null);
    startTransition(async () => {
      const res = await saveRolePermissionsAction(
        selectedRole.role,
        selectedRole.permissions,
      );
      if (res.success && res.data) {
        const savedData = res.data;
        setRoles((prev) =>
          prev.map((r) => (r.role === savedData.role ? savedData : r)),
        );
        setNotification({
          type: "success",
          message: `角色 [${selectedRole.name}] 权限配置已成功保存生效！`,
        });
      } else {
        setNotification({
          type: "error",
          message: res.error || "保存失败",
        });
      }
    });
  };

  // 7. 载入系统内置角色推荐权限模板 (需保存后生效)
  const handleLoadSystemDefaults = () => {
    if (!selectedRole || !selectedRole.isSystem) return;
    setNotification(null);
    startTransition(async () => {
      const res = await getSystemRoleDefaultsAction(selectedRole.role);
      if (res.success && res.data) {
        updateSelectedRolePermissions(res.data);
        setNotification({
          type: "success",
          message: `已载入 [${selectedRole.name}] 推荐权限模板。请确认配置并点击【保存权限】写入数据库生效。`,
        });
      } else {
        setNotification({
          type: "error",
          message: res.error || "获取推荐模板失败",
        });
      }
    });
  };

  // 9. 删除自定义角色
  const handleDeleteRole = (roleToDelete: string) => {
    if (
      !window.confirm(`确认删除业务角色 [${roleToDelete}] 吗？此操作无法撤销。`)
    ) {
      return;
    }
    setNotification(null);
    startTransition(async () => {
      const res = await deleteRoleAction(roleToDelete);
      if (res.success) {
        setRoles((prev) => prev.filter((r) => r.role !== roleToDelete));
        setSelectedRoleCode("admin");
        setNotification({
          type: "success",
          message: `角色 [${roleToDelete}] 已成功删除`,
        });
      } else {
        setNotification({
          type: "error",
          message: res.error || "删除失败",
        });
      }
    });
  };

  // 辅助渲染模块图标
  const renderModuleIcon = (iconName: string) => {
    switch (iconName) {
      case "UserCheck":
        return <UserCheck className="size-3.5 text-blue-600" />;
      case "PackageCheck":
        return <PackageCheck className="size-3.5 text-emerald-600" />;
      case "Users":
        return <Users className="size-3.5 text-indigo-600" />;
      case "ShieldCheck":
        return <ShieldCheck className="size-3.5 text-amber-600" />;
      case "Settings":
        return <Settings className="size-3.5 text-slate-600" />;
      case "FileText":
        return <FileText className="size-3.5 text-rose-600" />;
      default:
        return <Shield className="size-3.5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* 顶部标题横幅 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3.5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              角色与权限配置中心
            </h1>
            <Badge variant="default" size="sm" className="font-mono">
              <Shield className="size-3" />
              <span>RBAC 矩阵树驱动</span>
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            遵循工业级最佳实践：侧边栏大菜单由子页面权限自动推导展示/隐藏，支持页面操作细粒度勾选、Prisma
            数据范围隔离与敏感字段三态策略。
          </p>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="shadow-xs"
        >
          <Plus className="size-3.5" />
          <span>新建角色</span>
        </Button>
      </div>

      {/* 提示通知反馈栏 */}
      {notification && (
        <div
          className={`flex items-center gap-2 rounded-lg p-2.5 text-xs font-semibold border ${
            notification.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
              : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* 紧凑型主从工作台 (左侧角色列表 3 列，右侧权限矩阵 9 列) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* 左侧：角色列表导航 */}
        <Card className="lg:col-span-3 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <CardHeader className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Shield className="size-3.5 text-blue-600" />
                <span>租户企业角色</span>
              </CardTitle>
              <span className="text-[11px] font-mono text-slate-400">
                {roles.length} 个角色
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-2 space-y-1">
            {roles.map((r) => {
              const active = r.role === selectedRoleCode;
              return (
                <div
                  key={r.role}
                  onClick={() => setSelectedRoleCode(r.role)}
                  className={`group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs cursor-pointer transition-all border ${
                    active
                      ? "border-blue-600/30 bg-blue-50/80 text-blue-900 font-bold shadow-xs dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-100"
                      : "border-transparent hover:bg-slate-50 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="truncate">{r.name}</span>
                      {r.isSystem && (
                        <Badge
                          variant="outline"
                          size="sm"
                          className="text-[10px] px-1 py-0 h-4 border-slate-200 dark:border-slate-700 text-slate-500 font-normal shrink-0"
                        >
                          内置
                        </Badge>
                      )}
                      {!r.updatedAt && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal shrink-0">
                          (未配置)
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[10px] text-slate-400 truncate">
                      {r.role}
                    </div>
                  </div>

                  {!r.isSystem && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRole(r.role);
                      }}
                      className="opacity-0 group-hover:opacity-100 size-6 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 shrink-0"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* 右侧：权限配置表格与折叠树矩阵 (已移除多余的模块可见列) */}
        <Card className="lg:col-span-9 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <CardHeader className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {selectedRole?.name}
                </CardTitle>
                <Badge
                  variant={isSystemRole ? "default" : "secondary"}
                  size="sm"
                  className="text-[10px] h-5"
                >
                  {isSystemRole ? "系统内置" : "自定义角色"}
                </Badge>
                {!selectedRole?.updatedAt && (
                  <Badge
                    variant="outline"
                    size="sm"
                    className="text-[10px] h-5 border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-normal"
                  >
                    未配置权限 (Fail-Closed 拒绝访问)
                  </Badge>
                )}
                <span className="text-xs text-slate-400 truncate hidden sm:inline">
                  {selectedRole?.description || "细粒度权限配置"}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isSystemRole && (
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={handleLoadSystemDefaults}
                    disabled={isPending}
                    className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950/40"
                    title="根据系统切片契约快速填充推荐权限模板，需保存后生效"
                  >
                    <Sparkles className="size-3.5" />
                    <span className="hidden md:inline">载入推荐模板</span>
                  </Button>
                )}

                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={isPending}
                  className="shadow-xs shrink-0"
                >
                  <Save className="size-3.5" />
                  <span>{isPending ? "保存中..." : "保存权限"}</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-100/60 dark:border-slate-800 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold">
                    <th className="py-2.5 px-3 w-[280px]">功能模块 / 页面</th>
                    <th className="py-2.5 px-3 text-left">
                      功能操作权限 (Actions)
                    </th>
                    <th className="py-2.5 px-3 text-center w-[140px]">
                      数据过滤范围
                    </th>
                    <th className="py-2.5 px-2 text-center w-[90px]">
                      字段策略
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {permissionTree.map((mod) => {
                    const isExpanded = expandedModules[mod.moduleKey] ?? true;
                    // 只要模块下有任意一个页面拥有 read 权限，侧边栏自动点亮
                    const hasAnyPageVisible = mod.pages.some((p) => {
                      const actions =
                        selectedRole?.permissions.statement[p.resource] ?? [];
                      return actions.includes(StandardAction.READ);
                    });

                    return (
                      <React.Fragment key={mod.moduleKey}>
                        {/* 顶级模块分类行 */}
                        <tr className="bg-slate-50/70 dark:bg-slate-800/30 font-semibold border-t border-slate-200/60 dark:border-slate-800">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleModuleExpand(mod.moduleKey)
                                }
                                className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="size-3.5" />
                                ) : (
                                  <ChevronRight className="size-3.5" />
                                )}
                              </button>
                              <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                                {renderModuleIcon(mod.iconName)}
                                <span className="font-bold">{mod.label}</span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleModuleAll(mod)}
                                  className="text-[10px] text-slate-400 hover:text-blue-600 font-normal ml-1 underline"
                                >
                                  全模块切换
                                </button>
                              </div>
                            </div>
                          </td>

                          <td
                            className="py-2.5 px-3 text-slate-400 text-[11px]"
                            colSpan={3}
                          >
                            {hasAnyPageVisible ? (
                              <span className="text-emerald-600 font-medium">
                                ● 侧边栏已激活展示（已勾选该模块下页面）
                              </span>
                            ) : (
                              <span className="text-slate-400">
                                ○ 侧边栏自动收起（该模块下无任何可访问页面）
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* 模块下属页面行列表 */}
                        {isExpanded &&
                          mod.pages.map((page) => {
                            const currentActions =
                              selectedRole?.permissions.statement[
                                page.resource
                              ] ?? [];
                            const isAllChecked = page.actions.every((a) =>
                              currentActions.includes(a.action),
                            );
                            const hasRead = currentActions.includes(
                              StandardAction.READ,
                            );
                            const scope = getPageDataScope(page.resource);
                            const supportsScope = page.actions.some(
                              (a) =>
                                a.supportedScopes &&
                                a.supportedScopes.length > 0,
                            );
                            const hasFields =
                              page.configurableFields &&
                              page.configurableFields.length > 0;
                            const isFieldExpanded =
                              expandedFieldPages[page.resource] ?? false;

                            return (
                              <React.Fragment key={page.resource}>
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                  {/* 页面名称与全选操作 */}
                                  <td className="py-2.5 px-3 pl-8">
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-300 dark:text-slate-600 font-mono">
                                        └─
                                      </span>
                                      <span
                                        className={`font-medium ${
                                          hasRead
                                            ? "text-slate-900 dark:text-slate-100 font-bold"
                                            : "text-slate-500 dark:text-slate-400"
                                        }`}
                                      >
                                        {page.label}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleTogglePageAll(page)
                                        }
                                        className="text-[10px] text-slate-400 hover:text-blue-600 underline font-normal ml-1"
                                      >
                                        {isAllChecked ? "清空" : "全选"}
                                      </button>
                                    </div>
                                  </td>

                                  {/* 动作 Action 多选 Checkboxes */}
                                  <td className="py-2.5 px-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      {page.actions.map((act) => {
                                        const checked = isPageActionChecked(
                                          page.resource,
                                          act.action,
                                        );
                                        return (
                                          <label
                                            key={act.action}
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[11px] cursor-pointer transition-colors ${
                                              checked
                                                ? "border-blue-300 bg-blue-50/60 text-blue-800 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-200 font-medium"
                                                : "border-slate-200 bg-transparent text-slate-500 dark:border-slate-700 dark:text-slate-400"
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={checked}
                                              onChange={() =>
                                                handleTogglePageAction(
                                                  page,
                                                  act.action,
                                                )
                                              }
                                              className="size-3 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                            />
                                            <span>{act.label}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </td>

                                  {/* 数据范围下拉选择 */}
                                  <td className="py-2.5 px-3 text-center">
                                    {supportsScope && hasRead ? (
                                      <select
                                        value={scope}
                                        onChange={(e) =>
                                          handleDataScopeChange(
                                            page.resource,
                                            e.target.value as DataScopeType,
                                          )
                                        }
                                        className="h-7 text-xs rounded border border-slate-200 bg-white px-2 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      >
                                        {DATA_SCOPE_SELECT_OPTIONS.map(
                                          (opt) => (
                                            <option
                                              key={opt.value}
                                              value={opt.value}
                                            >
                                              {opt.label}
                                            </option>
                                          ),
                                        )}
                                      </select>
                                    ) : (
                                      <span className="text-[11px] text-slate-400 font-mono">
                                        -
                                      </span>
                                    )}
                                  </td>

                                  {/* 字段策略配置按钮 (若有受控字段) */}
                                  <td className="py-2.5 px-2 text-center">
                                    {hasFields ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleFieldExpand(page.resource)
                                        }
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                                          isFieldExpanded
                                            ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                            : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                                        }`}
                                      >
                                        <Sparkles className="size-3" />
                                        <span>
                                          {isFieldExpanded ? "收起" : "配置"}
                                        </span>
                                      </button>
                                    ) : (
                                      <span className="text-[11px] text-slate-400 font-mono">
                                        -
                                      </span>
                                    )}
                                  </td>
                                </tr>

                                {/* 字段细粒度展开矩阵抽屉 */}
                                {isFieldExpanded && page.configurableFields && (
                                  <tr className="bg-slate-50/80 dark:bg-slate-800/40">
                                    <td colSpan={4} className="p-3 pl-12">
                                      <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                            <Sparkles className="size-3.5 text-blue-600" />
                                            <span>
                                              【{page.label}】敏感资产与字段策略
                                            </span>
                                          </span>
                                          <span className="text-[11px] text-slate-400">
                                            字段三态策略：可读、可写、隐藏
                                          </span>
                                        </div>

                                        <table className="w-full text-xs border-collapse">
                                          <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[11px]">
                                              <th className="py-1.5 text-left font-medium">
                                                字段名称
                                              </th>
                                              <th className="py-1.5 text-center font-medium w-[80px]">
                                                查看权限
                                              </th>
                                              <th className="py-1.5 text-center font-medium w-[80px]">
                                                编辑权限
                                              </th>
                                              <th className="py-1.5 text-right font-medium w-[100px]">
                                                生效状态
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {page.configurableFields.map(
                                              (f) => {
                                                const mode = getFieldAccess(
                                                  page.subject,
                                                  f.field,
                                                  page.resource,
                                                );
                                                const canRead =
                                                  mode !== FieldPolicy.HIDDEN;
                                                const canWrite =
                                                  mode === FieldPolicy.EDITABLE;

                                                return (
                                                  <tr key={f.field}>
                                                    <td className="py-1.5">
                                                      <span className="font-medium text-slate-700 dark:text-slate-300">
                                                        {f.label}
                                                      </span>
                                                      <span className="font-mono text-[10px] text-slate-400 ml-1.5">
                                                        ({f.field})
                                                      </span>
                                                      {f.sensitive && (
                                                        <Badge
                                                          variant="outline"
                                                          size="sm"
                                                          className="ml-1.5 text-[9px] px-1 py-0 text-amber-600 border-amber-200"
                                                        >
                                                          敏感
                                                        </Badge>
                                                      )}
                                                    </td>
                                                    <td className="py-1.5 text-center">
                                                      <input
                                                        type="checkbox"
                                                        checked={canRead}
                                                        onChange={() =>
                                                          handleToggleFieldAccess(
                                                            page.subject,
                                                            f.field,
                                                            page.resource,
                                                            "read",
                                                          )
                                                        }
                                                        className="size-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                                      />
                                                    </td>
                                                    <td className="py-1.5 text-center">
                                                      <input
                                                        type="checkbox"
                                                        checked={canWrite}
                                                        disabled={!canRead}
                                                        onChange={() =>
                                                          handleToggleFieldAccess(
                                                            page.subject,
                                                            f.field,
                                                            page.resource,
                                                            "write",
                                                          )
                                                        }
                                                        className="size-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 disabled:opacity-30"
                                                      />
                                                    </td>
                                                    <td className="py-1.5 text-right font-mono text-[10px]">
                                                      {mode ===
                                                        FieldPolicy.EDITABLE && (
                                                        <span className="text-emerald-600 font-bold">
                                                          EDITABLE
                                                        </span>
                                                      )}
                                                      {mode ===
                                                        FieldPolicy.READONLY && (
                                                        <span className="text-blue-600 font-bold">
                                                          READONLY
                                                        </span>
                                                      )}
                                                      {mode ===
                                                        FieldPolicy.HIDDEN && (
                                                        <span className="text-rose-500 font-bold">
                                                          HIDDEN
                                                        </span>
                                                      )}
                                                    </td>
                                                  </tr>
                                                );
                                              },
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {showCreateModal && (
        <CreateRoleModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
