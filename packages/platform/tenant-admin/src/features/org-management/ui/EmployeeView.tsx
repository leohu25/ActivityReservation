"use client";

import React, { useState, useTransition } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Button,
  Badge,
  TreeFilter,
  type TreeNode,
  ConfirmDialog,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@base/ui";
import {
  Users,
  UserPlus,
  Building,
  Briefcase,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  FolderTree,
  UserCheck,
  UserX,
  ShieldCheck,
} from "lucide-react";
import type {
  DepartmentTreeNode,
  DirectCreateEmployeeInput,
  EmployeeItem,
  PositionItem,
} from "../types";
import {
  directCreateEmployeeAction,
  listEmployeesAction,
  resumeEmployeeAction,
  suspendEmployeeAction,
  transferDepartmentAction,
  transferPositionAction,
  transferRolesAction,
} from "../actions";
import { flattenTree, MasterDataStatus } from "@base/shared";

export interface EmployeeViewProps {
  readonly initialEmployees: readonly EmployeeItem[];
  readonly departmentTree: readonly DepartmentTreeNode[];
  readonly positions: readonly PositionItem[];
  readonly availableRoles: readonly { role: string; name: string }[];
}

function mapDeptToTreeNodes(nodes: readonly DepartmentTreeNode[]): TreeNode[] {
  return nodes.map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code,
    badge: d.employeeCount > 0 ? d.employeeCount : undefined,
    children: d.children ? mapDeptToTreeNodes(d.children) : undefined,
  }));
}

/**
 * 员工档案与人事调动中心面板组件 (现代数智工业风)
 * 支持部门树级联下推过滤、直接录入建号模式（免邮件直接在职）、调岗调部门与状态管控
 */
export function EmployeeView({
  initialEmployees,
  departmentTree,
  positions,
  availableRoles,
}: EmployeeViewProps) {
  const [employees, setEmployees] =
    useState<readonly EmployeeItem[]>(initialEmployees);

  // 部门树与筛选状态
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [includeChildren, setIncludeChildren] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedPositionId, setSelectedPositionId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // 弹窗状态
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [transferDeptEmp, setTransferDeptEmp] = useState<EmployeeItem | null>(
    null,
  );
  const [transferPosEmp, setTransferPosEmp] = useState<EmployeeItem | null>(
    null,
  );
  const [transferRolesEmp, setTransferRolesEmp] = useState<EmployeeItem | null>(
    null,
  );

  // 新增员工表单状态
  const [createForm, setCreateForm] = useState<{
    name: string;
    email: string;
    employeeNo: string;
    departmentId: string;
    positionId: string;
    jobTitle: string;
    roles: string[];
    password: string;
  }>({
    name: "",
    email: "",
    employeeNo: "",
    departmentId: "",
    positionId: "",
    jobTitle: "",
    roles: ["buyer"],
    password: "Admin123456!",
  });

  // 调动弹窗临时选择状态
  const [targetDeptId, setTargetDeptId] = useState("");
  const [targetPosId, setTargetPosId] = useState("");
  const [selectedRoleCodes, setSelectedRoleCodes] = useState<string[]>([]);

  const [isPending, startTransition] = useTransition();

  const flatDepts = flattenTree(departmentTree);

  const refreshList = async () => {
    const res = await listEmployeesAction({
      departmentId: selectedDeptId || undefined,
      includeChildren,
      positionId: selectedPositionId || undefined,
      status: selectedStatus || undefined,
      search: searchKeyword || undefined,
    });
    if (res.success && res.data) {
      setEmployees(res.data);
    }
  };

  const handleDeptSelect = (deptId: string | null) => {
    setSelectedDeptId(deptId);
    startTransition(async () => {
      const res = await listEmployeesAction({
        departmentId: deptId || undefined,
        includeChildren,
        positionId: selectedPositionId || undefined,
        status: selectedStatus || undefined,
        search: searchKeyword || undefined,
      });
      if (res.success && res.data) {
        setEmployees(res.data);
      }
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await refreshList();
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim()) {
      setFeedback({ type: "error", message: "姓名与邮箱为必填项" });
      return;
    }
    if (createForm.roles.length === 0) {
      setFeedback({ type: "error", message: "至少需为员工指定一个系统角色" });
      return;
    }

    startTransition(async () => {
      const payload: DirectCreateEmployeeInput = {
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        employeeNo: createForm.employeeNo.trim() || undefined,
        departmentId: createForm.departmentId || null,
        positionId: createForm.positionId || null,
        jobTitle: createForm.jobTitle.trim() || undefined,
        initialRoleCodes: createForm.roles,
        password: createForm.password.trim() || undefined,
      };

      const res = await directCreateEmployeeAction(payload);
      if (res.success) {
        setFeedback({
          type: "success",
          message: `员工 [${payload.name}] 已直接录入建号并激活在职`,
        });
        setIsCreateOpen(false);
        setCreateForm({
          name: "",
          email: "",
          employeeNo: "",
          departmentId: "",
          positionId: "",
          jobTitle: "",
          roles: ["buyer"],
          password: "Admin123456!",
        });
        await refreshList();
      } else {
        setFeedback({
          type: "error",
          message: res.error || "创建员工失败",
        });
      }
    });
  };

  const handleTransferDept = () => {
    if (!transferDeptEmp) return;
    startTransition(async () => {
      const res = await transferDepartmentAction({
        employeeId: transferDeptEmp.id,
        targetDepartmentId: targetDeptId || null,
      });
      if (res.success) {
        setFeedback({
          type: "success",
          message: `员工 [${transferDeptEmp.name}] 部门调换成功，权限下推已即时重算`,
        });
        setTransferDeptEmp(null);
        await refreshList();
      } else {
        setFeedback({
          type: "error",
          message: res.error || "调换部门失败",
        });
      }
    });
  };

  const handleTransferPos = () => {
    if (!transferPosEmp) return;
    startTransition(async () => {
      const res = await transferPositionAction({
        employeeId: transferPosEmp.id,
        targetPositionId: targetPosId || null,
      });
      if (res.success) {
        setFeedback({
          type: "success",
          message: `员工 [${transferPosEmp.name}] 岗位调换成功`,
        });
        setTransferPosEmp(null);
        await refreshList();
      } else {
        setFeedback({
          type: "error",
          message: res.error || "调换岗位失败",
        });
      }
    });
  };

  const handleTransferRoles = () => {
    if (!transferRolesEmp || !transferRolesEmp.memberId) return;
    if (selectedRoleCodes.length === 0) {
      setFeedback({ type: "error", message: "至少需选择一个角色" });
      return;
    }

    startTransition(async () => {
      const res = await transferRolesAction({
        memberId: transferRolesEmp.memberId!,
        newRoleCodes: selectedRoleCodes,
      });
      if (res.success) {
        setFeedback({
          type: "success",
          message: `员工 [${transferRolesEmp.name}] 系统角色已调整，权限已即时更新`,
        });
        setTransferRolesEmp(null);
        await refreshList();
      } else {
        setFeedback({
          type: "error",
          message: res.error || "调整角色失败",
        });
      }
    });
  };

  const [suspendTarget, setSuspendTarget] = useState<EmployeeItem | null>(null);

  const confirmToggleSuspend = (emp: EmployeeItem) => {
    const isSuspended = emp.status === "SUSPENDED";
    const actionName = isSuspended ? "恢复" : "停用";

    startTransition(async () => {
      const res = isSuspended
        ? await resumeEmployeeAction(emp.id)
        : await suspendEmployeeAction(emp.id);

      if (res.success) {
        setFeedback({
          type: "success",
          message: `员工 [${emp.name}] 已${actionName}`,
        });
        await refreshList();
      } else {
        setFeedback({
          type: "error",
          message: res.error || `${actionName}操作失败`,
        });
      }
      setSuspendTarget(null);
    });
  };

  return (
    <div className="space-y-6">
      {/* 顶部标题与直接建号操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            员工档案与人事调动
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            维护企业内部员工档案。支持直接建号（免邮件直接在职激活），调部门即刻联动
            CASL 权限下推范围，调岗不改变权限。
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
        >
          <UserPlus className="mr-1.5 size-4" />
          新增员工（直接建号）
        </Button>
      </div>

      {/* 反馈信息 */}
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3.5 text-xs font-semibold border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 左右分栏布局 */}
      <div className="flex flex-col gap-6 lg:flex-row items-start">
        {/* 左栏：基于官方通用 TreeFilter 的部门架构过滤树 */}
        <div className="w-full lg:w-64 shrink-0">
          <TreeFilter
            title="部门级联过滤"
            allLabel="全公司所有员工"
            totalCount={employees.length}
            nodes={mapDeptToTreeNodes(departmentTree)}
            selectedId={selectedDeptId}
            onSelect={(id) => handleDeptSelect(id)}
            searchPlaceholder="过滤部门..."
            cascadeToggle={{
              checked: includeChildren,
              onChange: (checked) => {
                setIncludeChildren(checked);
                startTransition(async () => {
                  const res = await listEmployeesAction({
                    departmentId: selectedDeptId || undefined,
                    includeChildren: checked,
                    positionId: selectedPositionId || undefined,
                    status: selectedStatus || undefined,
                    search: searchKeyword || undefined,
                  });
                  if (res.success && res.data) setEmployees(res.data);
                });
              },
              label: "级联包含子部门",
            }}
          />
        </div>

        {/* 右栏：员工列表与多维工具栏 */}
        <div className="flex-1 w-full space-y-4">
          {/* 工具栏 */}
          <Card className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-wrap items-center gap-3"
            >
              <div className="relative min-w-[200px] flex-1">
                <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
                <Input
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="搜索姓名、邮箱或工号..."
                  className="pl-9 text-xs h-9"
                />
              </div>

              <select
                value={selectedPositionId}
                onChange={(e) => {
                  setSelectedPositionId(e.target.value);
                  startTransition(async () => {
                    const res = await listEmployeesAction({
                      departmentId: selectedDeptId || undefined,
                      includeChildren,
                      positionId: e.target.value || undefined,
                      status: selectedStatus || undefined,
                      search: searchKeyword || undefined,
                    });
                    if (res.success && res.data) setEmployees(res.data);
                  });
                }}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">全部岗位</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  startTransition(async () => {
                    const res = await listEmployeesAction({
                      departmentId: selectedDeptId || undefined,
                      includeChildren,
                      positionId: selectedPositionId || undefined,
                      status: e.target.value || undefined,
                      search: searchKeyword || undefined,
                    });
                    if (res.success && res.data) setEmployees(res.data);
                  });
                }}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">全部状态</option>
                <option value="ACTIVE">在职</option>
                <option value="SUSPENDED">已停用</option>
                <option value="TERMINATED">已离职</option>
              </select>

              <Button
                type="submit"
                size="sm"
                variant="outline"
                className="h-9 text-xs"
              >
                筛选
              </Button>
            </form>
          </Card>

          {/* 员工数据表格 */}
          <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-0">
              {employees.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  未匹配到任何员工记录，请调整筛选条件或直接录入新员工
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="w-full text-xs">
                    <TableHeader className="bg-muted/50 font-medium">
                      <TableRow className="border-b border-border">
                        <TableHead className="px-5 py-3 text-xs font-semibold text-muted-foreground">
                          员工姓名与账号
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                          工号
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                          所属部门
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                          承担岗位
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                          系统角色
                        </TableHead>
                        <TableHead className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                          状态
                        </TableHead>
                        <TableHead className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">
                          人事与权限操作
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border/60">
                      {employees.map((emp) => {
                        const isActive = emp.status === MasterDataStatus.ACTIVE;
                        const isSuspended = emp.status === "SUSPENDED";
                        return (
                          <TableRow
                            key={emp.id}
                            className="hover:bg-muted/40 transition-colors"
                          >
                            <TableCell className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                  {emp.name.slice(0, 1)}
                                </div>
                                <div>
                                  <div className="font-bold text-foreground">
                                    {emp.name}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground font-mono">
                                    {emp.email}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3.5 font-mono text-muted-foreground">
                              {emp.employeeNo ? (
                                <Badge
                                  variant="outline"
                                  className="text-[11px] font-mono"
                                >
                                  {emp.employeeNo}
                                </Badge>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell className="px-4 py-3.5 text-foreground">
                              {emp.departmentName || (
                                <span className="text-muted-foreground">
                                  未分配
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="px-4 py-3.5 text-foreground">
                              {emp.positionName || (
                                <span className="text-muted-foreground">
                                  未指定
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="px-4 py-3.5">
                              <div className="flex flex-wrap gap-1">
                                {emp.roles.map((r) => (
                                  <span
                                    key={r}
                                    className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border"
                                  >
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3.5 text-center">
                              <Badge
                                variant={
                                  isActive
                                    ? "success"
                                    : isSuspended
                                      ? "warning"
                                      : "secondary"
                                }
                                size="sm"
                              >
                                {isActive
                                  ? "在职"
                                  : isSuspended
                                    ? "已停用"
                                    : "已离职"}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-5 py-3.5 text-right space-x-1 whitespace-nowrap">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-primary hover:bg-muted"
                                onClick={() => {
                                  setTransferDeptEmp(emp);
                                  setTargetDeptId(emp.departmentId || "");
                                }}
                              >
                                <Building className="mr-1 size-3.5" />
                                调部门
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-indigo-600 hover:bg-muted"
                                onClick={() => {
                                  setTransferPosEmp(emp);
                                  setTargetPosId(emp.positionId || "");
                                }}
                              >
                                <Briefcase className="mr-1 size-3.5" />
                                调岗位
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-purple-600 hover:bg-muted"
                                onClick={() => {
                                  setTransferRolesEmp(emp);
                                  setSelectedRoleCodes([...emp.roles]);
                                }}
                              >
                                <ShieldCheck className="mr-1 size-3.5" />
                                调角色
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-7 text-xs ${
                                  isActive
                                    ? "text-destructive hover:text-destructive hover:bg-muted"
                                    : "text-emerald-600 hover:bg-muted"
                                }`}
                                onClick={() => setSuspendTarget(emp)}
                              >
                                {isActive ? (
                                  <>
                                    <UserX className="mr-1 size-3.5" />
                                    停用
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-1 size-3.5" />
                                    恢复
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 弹窗 1：直接录入建号新员工 */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              直接录入新员工（免邮件建号）
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              系统将原子创建全局用户、租户成员并生成在职员工档案，员工凭初始密码可立即登录进入系统。
            </p>

            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    员工姓名 <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="例如: 王小明"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    登录邮箱 <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="email"
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="例如: wang@company.com"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    工号 (可选)
                  </label>
                  <Input
                    value={createForm.employeeNo}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        employeeNo: e.target.value,
                      }))
                    }
                    placeholder="例如: E1001"
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    职务头衔 (可选)
                  </label>
                  <Input
                    value={createForm.jobTitle}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        jobTitle: e.target.value,
                      }))
                    }
                    placeholder="例如: 华东区域采购专员"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    所属部门
                  </label>
                  <select
                    value={createForm.departmentId}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        departmentId: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="">-- 暂不分配部门 --</option>
                    {flatDepts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {"— ".repeat(d.depth)}
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    承担岗位
                  </label>
                  <select
                    value={createForm.positionId}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        positionId: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="">-- 暂不指定岗位 --</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  初始系统角色 <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  {availableRoles.map((r) => {
                    const isChecked = createForm.roles.includes(r.role);
                    return (
                      <label
                        key={r.role}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer border transition-colors ${
                          isChecked
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateForm((prev) => ({
                                ...prev,
                                roles: [...prev.roles, r.role],
                              }));
                            } else {
                              setCreateForm((prev) => ({
                                ...prev,
                                roles: prev.roles.filter((x) => x !== r.role),
                              }));
                            }
                          }}
                          className="sr-only"
                        />
                        <span>{r.name}</span>
                        <span
                          className={`text-[10px] font-mono ${
                            isChecked ? "text-blue-100" : "text-slate-400"
                          }`}
                        >
                          ({r.role})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  初始登录密码
                </label>
                <Input
                  type="text"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="默认: Admin123456!"
                  className="text-xs font-mono"
                />
                <p className="text-[11px] text-slate-400">
                  员工可凭该密码直接登录系统，后续可在安全设置中强制首次登录修改。
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isPending}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isPending ? "创建建号中..." : "确认建号入职"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 弹窗 2：调换部门 */}
      {transferDeptEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              调整所属部门
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              为员工 [{transferDeptEmp.name}]
              重新指派部门。系统将自动自增权限版本号，CASL
              数据下推范围立即生效。
            </p>

            <div className="mt-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  目标部门
                </label>
                <select
                  value={targetDeptId}
                  onChange={(e) => setTargetDeptId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="">-- 无部门 (清空现有部门分配) --</option>
                  {flatDepts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {"— ".repeat(d.depth)}
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200/70 dark:bg-slate-800/50 dark:border-slate-700/60 dark:text-slate-300">
                <p className="text-[11px] leading-relaxed">
                  提示：调换部门后，该员工的业务数据访问范围将同步变更为新部门及其子部门范围。
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTransferDeptEmp(null)}
                  disabled={isPending}
                >
                  取消
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isPending}
                  onClick={handleTransferDept}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isPending ? "保存中..." : "确认调换部门"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 弹窗 3：调换岗位 */}
      {transferPosEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              调整承担岗位
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              为员工 [{transferPosEmp.name}] 指定新的企业岗位。遵循 Position !=
              Role 原则，调岗不改变其系统角色权限。
            </p>

            <div className="mt-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  目标岗位
                </label>
                <select
                  value={targetPosId}
                  onChange={(e) => setTargetPosId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="">-- 无岗位 (清空现有岗位分配) --</option>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTransferPosEmp(null)}
                  disabled={isPending}
                >
                  取消
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isPending}
                  onClick={handleTransferPos}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isPending ? "保存中..." : "确认调换岗位"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 弹窗 4：调换系统角色 */}
      {transferRolesEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              调整系统角色与权限
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              修改员工 [{transferRolesEmp.name}]
              拥有的角色集合。保存后立即自增权限版本号，使缓存的能力集失效。
            </p>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  选择分配角色 (可多选)
                </label>
                <div className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
                  {availableRoles.map((r) => {
                    const isChecked = selectedRoleCodes.includes(r.role);
                    return (
                      <label
                        key={r.role}
                        className="flex items-center justify-between rounded-lg p-2 text-xs font-semibold cursor-pointer hover:bg-white transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRoleCodes((prev) => [
                                  ...prev,
                                  r.role,
                                ]);
                              } else {
                                setSelectedRoleCodes((prev) =>
                                  prev.filter((x) => x !== r.role),
                                );
                              }
                            }}
                            className="rounded border-slate-300 text-blue-600 size-3.5"
                          />
                          <span className="text-slate-800">{r.name}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {r.role}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTransferRolesEmp(null)}
                  disabled={isPending}
                >
                  取消
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isPending}
                  onClick={handleTransferRoles}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isPending ? "保存中..." : "确认调整角色"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 停用/启用员工确认弹窗 */}
      <ConfirmDialog
        open={Boolean(suspendTarget)}
        onOpenChange={(open) => {
          if (!open) setSuspendTarget(null);
        }}
        title={`确定要${suspendTarget?.status === "SUSPENDED" ? "恢复" : "停用"}员工 [${suspendTarget?.name || ""}] 吗？`}
        description={
          suspendTarget?.status === "SUSPENDED"
            ? "恢复后将重新允许访问当前企业。"
            : "停用后将立即阻断其访问当前企业，但不会封禁全局用户。"
        }
        confirmText={`确认${suspendTarget?.status === "SUSPENDED" ? "恢复" : "停用"}`}
        variant={
          suspendTarget?.status === "SUSPENDED" ? "default" : "destructive"
        }
        onConfirm={async () => {
          if (suspendTarget) {
            confirmToggleSuspend(suspendTarget);
          }
        }}
      />
    </div>
  );
}
