"use client";

import React, { useState, useTransition } from "react";
import {
  ShieldCheck,
  Shield,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
  Layers,
  Sparkles,
  Eye,
  Edit,
  Download,
  Building,
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
  type DataScopeType,
  type FieldAccessMode,
  type RolePermissionPayload,
} from "@chenrun/authorization";
import {
  procurementConfigurableFields,
  ProcurementPermission,
  ProcurementSubject,
} from "@chenrun/feature-procurement-center";
import type { TenantRoleItem } from "../types";
import {
  saveRolePermissionsAction,
  createRoleAction,
  deleteRoleAction,
} from "../actions";

interface RolePermissionManagerProps {
  readonly initialRoles: readonly TenantRoleItem[];
  readonly activeOrgId: string;
}

const DATA_SCOPE_OPTIONS: Array<{
  value: DataScopeType;
  label: string;
  desc: string;
}> = [
  {
    value: DataScope.SELF,
    label: "仅本人数据",
    desc: "只允许访问由当前登录成员创建的业务单据",
  },
  {
    value: DataScope.DEPT,
    label: "本部门数据",
    desc: "允许访问当前成员所属部门的全部业务单据",
  },
  {
    value: DataScope.DEPT_TREE,
    label: "本部门及下级部门",
    desc: "包含本部门以及所有下属分支部门数据",
  },
  {
    value: DataScope.ALL,
    label: "全公司/全租户",
    desc: "无部门范围约束，允许访问全租户组织业务数据",
  },
];

export function RolePermissionManager({
  initialRoles,
}: RolePermissionManagerProps) {
  const [roles, setRoles] = useState<TenantRoleItem[]>([...initialRoles]);
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>(
    initialRoles[0]?.role || "owner",
  );
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // 新增角色模态框状态
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleCode, setNewRoleCode] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");

  const selectedRole =
    roles.find((r) => r.role === selectedRoleCode) || roles[0];

  // 内部编辑状态
  const resource = ProcurementPermission.order.resource;
  const currentStatement = selectedRole?.permissions.statement[resource] ?? [];

  const hasWriteAction =
    currentStatement.includes("update") || currentStatement.includes("create");
  const hasReadAction = currentStatement.includes("read");

  // 获取当前角色的数据范围 (默认 DEPT)
  const currentScopeType: DataScopeType =
    selectedRole?.permissions.dataScopes?.find(
      (s) => s.resource === resource && (!s.action || s.action === "read"),
    )?.scopeType ?? DataScope.DEPT;

  // 获取当前角色的字段策略配置
  const currentFieldPolicies = selectedRole?.permissions.fieldPolicies ?? [];

  const isSystemRole = selectedRole?.isSystem ?? false;

  // 计算指定字段的生效访问状态 (对齐 SaaS Foundation 授权推导规则)
  // 当 policy 为 undefined（即未受限/未单独配置字段策略）时：
  // 若当前角色在 statement 中拥有当前模块的 'update' 或 'create' 动作，默认推导为 'EDITABLE'；
  // 若仅有 'read' 动作，默认推导为 'READONLY'；若均无，则为 'HIDDEN'。
  const getEffectiveFieldAccess = (fieldName: string): FieldAccessMode => {
    const policy = currentFieldPolicies.find(
      (p) => p.subject === ProcurementSubject && p.field === fieldName,
    );
    if (policy) {
      return policy.access;
    }
    if (hasWriteAction) {
      return FieldPolicy.EDITABLE;
    }
    if (hasReadAction) {
      return FieldPolicy.READONLY;
    }
    return FieldPolicy.HIDDEN;
  };

  // 切换动作开关
  const handleToggleAction = (action: string) => {
    if (!selectedRole) return;
    const exists = currentStatement.includes(action);
    const nextActions = exists
      ? currentStatement.filter((a) => a !== action)
      : [...currentStatement, action];

    updateSelectedRolePermissions({
      ...selectedRole.permissions,
      statement: {
        ...selectedRole.permissions.statement,
        [resource]: nextActions,
      },
    });
  };

  // 切换数据范围
  const handleScopeChange = (scopeType: DataScopeType) => {
    if (!selectedRole) return;
    const existingScopes = (selectedRole.permissions.dataScopes ?? []).filter(
      (s) => s.resource !== resource,
    );
    updateSelectedRolePermissions({
      ...selectedRole.permissions,
      dataScopes: [
        ...existingScopes,
        {
          resource,
          action: "read",
          scopeType,
        },
      ],
    });
  };

  // 切换字段读权限 (READONLY / HIDDEN)
  const handleToggleFieldRead = (fieldName: string) => {
    if (!selectedRole) return;
    const currentAccess = getEffectiveFieldAccess(fieldName);
    const nextPolicies = currentFieldPolicies.filter(
      (p) => !(p.subject === ProcurementSubject && p.field === fieldName),
    );

    if (currentAccess === FieldPolicy.HIDDEN) {
      // 当前 HIDDEN -> 转为 READONLY
      nextPolicies.push({
        subject: ProcurementSubject,
        field: fieldName,
        access: FieldPolicy.READONLY,
      });
    } else {
      // 当前可读 -> 转为 HIDDEN
      nextPolicies.push({
        subject: ProcurementSubject,
        field: fieldName,
        access: FieldPolicy.HIDDEN,
      });
    }

    updateSelectedRolePermissions({
      ...selectedRole.permissions,
      fieldPolicies: nextPolicies,
    });
  };

  // 切换字段写权限 (EDITABLE vs READONLY)
  const handleToggleFieldWrite = (fieldName: string) => {
    if (!selectedRole) return;
    const currentAccess = getEffectiveFieldAccess(fieldName);
    const nextPolicies = currentFieldPolicies.filter(
      (p) => !(p.subject === ProcurementSubject && p.field === fieldName),
    );

    if (currentAccess === FieldPolicy.EDITABLE) {
      // 降级为只读
      nextPolicies.push({
        subject: ProcurementSubject,
        field: fieldName,
        access: FieldPolicy.READONLY,
      });
    } else {
      // 提升为可写
      nextPolicies.push({
        subject: ProcurementSubject,
        field: fieldName,
        access: FieldPolicy.EDITABLE,
      });
    }

    updateSelectedRolePermissions({
      ...selectedRole.permissions,
      fieldPolicies: nextPolicies,
    });
  };

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

  // 保存当前角色权限
  const handleSave = () => {
    if (!selectedRole) return;
    setNotification(null);
    startTransition(async () => {
      const res = await saveRolePermissionsAction(
        selectedRole.role,
        selectedRole.permissions,
      );
      if (res.success && res.data) {
        setNotification({
          type: "success",
          message: `角色 [${selectedRole.name}] 权限配置已成功持久化生效！`,
        });
      } else {
        setNotification({
          type: "error",
          message: res.error || "保存失败",
        });
      }
    });
  };

  // 提交创建角色
  const handleCreateRole = () => {
    if (!newRoleCode.trim()) return;
    setNotification(null);
    startTransition(async () => {
      const res = await createRoleAction(
        newRoleCode.trim(),
        newRoleName.trim() || undefined,
        newRoleDesc.trim() || undefined,
      );
      if (res.success && res.data) {
        setRoles((prev) => [...prev, res.data!]);
        setSelectedRoleCode(res.data.role);
        setShowCreateModal(false);
        setNewRoleCode("");
        setNewRoleName("");
        setNewRoleDesc("");
        setNotification({
          type: "success",
          message: `新业务角色 [${res.data.name}] 已成功创建！`,
        });
      } else {
        setNotification({
          type: "error",
          message: res.error || "创建失败",
        });
      }
    });
  };

  // 删除自定义角色
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
        setSelectedRoleCode("owner");
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

  return (
    <div className="space-y-6">
      {/* 顶部标题横幅 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              角色与权限配置中心
            </h1>
            <Badge variant="default" size="sm">
              <ShieldCheck className="size-3" />
              <span>四层权限矩阵驱动</span>
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            遵循 SaaS 工业级权限方案：功能 Actions 勾选、数据 Scope
            下推与字段三态矩阵 (查看/修改/导出) 全闭环。
          </p>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="shadow-sm shadow-blue-600/25"
        >
          <Plus className="size-3.5" />
          <span>新建自定义角色</span>
        </Button>
      </div>

      {/* 提示反馈栏 */}
      {notification && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3.5 text-xs font-semibold border ${
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

      {/* 核心主从工作台 (左侧角色选择，右侧四层权限配置矩阵) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左侧：角色列表侧栏卡片 */}
        <Card className="lg:col-span-4 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Shield className="size-4 text-blue-600" />
              <span>租户角色列表</span>
            </CardTitle>
            <CardDescription className="text-xs">
              包含系统内置角色与自定义扩展角色
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 space-y-1.5 flex-1">
            {roles.map((r) => {
              const active = r.role === selectedRoleCode;
              return (
                <div
                  key={r.role}
                  onClick={() => setSelectedRoleCode(r.role)}
                  className={`group flex items-center justify-between rounded-xl px-3.5 py-3 text-xs cursor-pointer transition-all border ${
                    active
                      ? "border-blue-600/30 bg-blue-50/70 text-blue-900 shadow-xs dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-100"
                      : "border-transparent hover:bg-slate-50 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>{r.name}</span>
                      {r.isSystem && (
                        <Badge
                          variant="outline"
                          size="sm"
                          className="text-[10px] py-0"
                        >
                          内置
                        </Badge>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">
                      code: {r.role}
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
                      className="opacity-0 group-hover:opacity-100 size-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* 右侧：四层权限配置矩阵视图 */}
        <Card className="lg:col-span-8 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-black text-slate-900 dark:text-slate-100">
                    {selectedRole?.name}
                  </CardTitle>
                  <Badge
                    variant={isSystemRole ? "default" : "secondary"}
                    size="sm"
                  >
                    {isSystemRole ? "系统保留角色" : "自定义业务角色"}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {selectedRole?.description ||
                    "配置该角色在租户内部的功能、数据与字段细粒度授权。"}
                </CardDescription>
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={isPending}
                className="shadow-sm shadow-blue-600/25"
              >
                <Save className="size-3.5" />
                <span>{isPending ? "保存生效中..." : "保存权限配置"}</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-8">
            {/* 第一层：功能操作权限 (Actions) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Layers className="size-4 text-blue-600" />
                <span>一、功能按钮与操作权限 (Actions)</span>
              </div>
              <div className="rounded-xl border border-slate-200/80 p-4 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                  采购订单管理 (procurement.order)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { action: "read", label: "查看订单" },
                    { action: "create", label: "新建订单" },
                    { action: "update", label: "修改订单" },
                    { action: "audit", label: "审批订单" },
                    { action: "export", label: "导出数据" },
                  ].map((act) => {
                    const checked = currentStatement.includes(act.action);
                    return (
                      <label
                        key={act.action}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                          checked
                            ? "border-blue-500 bg-white text-blue-700 shadow-xs dark:bg-slate-900 dark:text-blue-300 dark:border-blue-600"
                            : "border-slate-200 bg-transparent text-slate-600 dark:border-slate-700 dark:text-slate-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleAction(act.action)}
                          className="size-3.5 rounded-sm text-blue-600 focus:ring-blue-500 border-slate-300"
                        />
                        <span>{act.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 第二层：数据访问范围 (Data Scope) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Building className="size-4 text-blue-600" />
                <span>二、数据过滤范围 (Data Scope)</span>
              </div>
              <div className="rounded-xl border border-slate-200/80 p-4 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30 space-y-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  决定拥有该角色的员工在查询采购单列表时，Prisma
                  自动下推的过滤范围：
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DATA_SCOPE_OPTIONS.map((opt) => {
                    const selected = currentScopeType === opt.value;
                    return (
                      <div
                        key={opt.value}
                        onClick={() => handleScopeChange(opt.value)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          selected
                            ? "border-blue-600 bg-white text-blue-900 shadow-xs dark:bg-slate-900 dark:border-blue-500 dark:text-blue-100"
                            : "border-slate-200 hover:bg-white text-slate-700 dark:border-slate-700 dark:hover:bg-slate-800/50 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold mb-1">
                          <span>{opt.label}</span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {opt.value}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          {opt.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 第三层：字段权限四维控制矩阵 (Field Matrix) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Sparkles className="size-4 text-blue-600" />
                <span>三、字段权限控制矩阵 (Field Permissions Matrix)</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 dark:border-slate-800 dark:bg-slate-800/60">
                    <tr>
                      <th className="px-4 py-3 font-bold">字段名与资产说明</th>
                      <th className="px-4 py-3 font-bold text-center">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="size-3" /> 查看权限
                        </span>
                      </th>
                      <th className="px-4 py-3 font-bold text-center">
                        <span className="inline-flex items-center gap-1">
                          <Edit className="size-3" /> 允许修改
                        </span>
                      </th>
                      <th className="px-4 py-3 font-bold text-center">
                        <span className="inline-flex items-center gap-1">
                          <Download className="size-3" /> 导出包含
                        </span>
                      </th>
                      <th className="px-4 py-3 font-bold text-right">
                        推导前端状态
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {procurementConfigurableFields.map((row) => {
                      const effectiveAccess = getEffectiveFieldAccess(
                        row.field,
                      );
                      const isHidden = effectiveAccess === FieldPolicy.HIDDEN;
                      const isEditable =
                        effectiveAccess === FieldPolicy.EDITABLE;

                      return (
                        <tr
                          key={row.field}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                              <span>{row.label}</span>
                              {row.isSensitive && (
                                <Badge
                                  variant="warning"
                                  size="sm"
                                  className="text-[10px] py-0"
                                >
                                  <Lock className="size-2.5" />
                                  <span>敏感资产</span>
                                </Badge>
                              )}
                            </div>
                            <div className="font-mono text-[11px] text-slate-400">
                              {row.field}
                            </div>
                          </td>

                          {/* 查看权限勾选 */}
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={!isHidden}
                              onChange={() => handleToggleFieldRead(row.field)}
                              className="size-4 rounded-sm text-blue-600 focus:ring-blue-500 border-slate-300"
                            />
                          </td>

                          {/* 修改权限勾选 */}
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={isEditable}
                              disabled={isHidden}
                              onChange={() => handleToggleFieldWrite(row.field)}
                              className="size-4 rounded-sm text-blue-600 focus:ring-blue-500 border-slate-300 disabled:opacity-30"
                            />
                          </td>

                          {/* 导出权限 */}
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={!isHidden}
                              disabled={isHidden}
                              readOnly
                              className="size-4 rounded-sm text-blue-600 focus:ring-blue-500 border-slate-300 disabled:opacity-30"
                            />
                          </td>

                          {/* 推导状态标签 */}
                          <td className="px-4 py-3 text-right">
                            {isHidden ? (
                              <Badge variant="destructive" size="sm">
                                隐藏 (HIDDEN)
                              </Badge>
                            ) : isEditable ? (
                              <Badge variant="success" size="sm">
                                可编辑 (EDITABLE)
                              </Badge>
                            ) : (
                              <Badge variant="outline" size="sm">
                                只读 (READONLY)
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 新增角色弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                新建租户业务角色
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                创建专属于您企业的业务岗位角色，并配置四层权限。
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  角色标识编码 (Role Code) *
                </label>
                <Input
                  placeholder="例如: buyer, warehouse_lead"
                  value={newRoleCode}
                  onChange={(e) => setNewRoleCode(e.target.value.toLowerCase())}
                  className="mt-1"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  仅允许小写英文、数字与下划线，保存后不可更改。
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  角色显示名称
                </label>
                <Input
                  placeholder="例如: 采购专员"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  职责说明
                </label>
                <Input
                  placeholder="岗位职责简述"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateModal(false)}
              >
                取消
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleCreateRole}
                disabled={!newRoleCode.trim() || isPending}
              >
                {isPending ? "创建中..." : "确认创建"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
