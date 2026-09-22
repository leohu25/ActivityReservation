"use client";

import { useState, useMemo, useCallback } from "react";
import {
  DataTable,
  Badge,
  DataTableRowActions,
  TreeFilter,
  Combobox,
  type TreeNode,
  type ColumnDef,
  toast,
  useListSearch,
} from "@base/ui";
import { MasterDataStatus } from "@base/shared";
import {
  EmployeeField,
  employeePageContract,
  employeeSearchParams,
} from "../contract";
import {
  suspendEmployeeAction,
  resumeEmployeeAction,
} from "../actions";
import { EmployeeFormModal } from "./EmployeeFormModal";
import type { EmployeeItem } from "../types";
import type { DepartmentTreeNode } from "../../department/types";
import type { PositionItem } from "../../position/types";

export interface EmployeeViewProps {
  /** 服务端员工列表数据 (纯数据受控) */
  data: EmployeeItem[];
  /** 服务端总数 */
  total: number;
  /** 部门组织架构树 */
  departmentTree: readonly DepartmentTreeNode[];
  /** 企业岗位字典 */
  positions: readonly PositionItem[];
  /** 租户可用系统角色列表 */
  availableRoles: readonly { role: string; name: string }[];
}

function mapDeptToTreeNodes(nodes: readonly DepartmentTreeNode[]): TreeNode[] {
  return nodes.map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code,
    badge: d.employeeCount > 0 ? `${d.employeeCount}人` : undefined,
    children: d.children ? mapDeptToTreeNodes(d.children) : undefined,
  }));
}

function flattenDepts(
  nodes: readonly DepartmentTreeNode[],
  depth = 0,
): { id: string; name: string; depth: number }[] {
  const result: { id: string; name: string; depth: number }[] = [];
  for (const n of nodes) {
    result.push({ id: n.id, name: n.name, depth });
    if (n.children && n.children.length > 0) {
      result.push(...flattenDepts(n.children, depth + 1));
    }
  }
  return result;
}

/**
 * 员工档案管理工作台 (现代数智工业风)
 * 严格遵循框架标准 CRUD 资源范式：
 * - 列表：DataTable + URL-as-State (useListSearch)
 * - 左侧：TreeFilter 部门级联导航
 * - 行动作：内置 查看(onView) / 编辑(onEdit) / 停用(onDelete) 标准闭环
 * - 弹窗：三态 EmployeeFormModal (create / edit / view)
 */
export function EmployeeView({
  data,
  total,
  departmentTree,
  positions,
  availableRoles,
}: EmployeeViewProps) {
  const list = useListSearch(employeeSearchParams);

  const flatDepts = useMemo(() => flattenDepts(departmentTree), [departmentTree]);
  const treeNodes = useMemo(
    () => mapDeptToTreeNodes(departmentTree),
    [departmentTree],
  );

  // 弹窗状态管理 (标准三态)
  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: "create" | "edit" | "view";
    record?: EmployeeItem | null;
  }>({
    open: false,
    mode: "create",
    record: null,
  });

  const handleToggleStatus = useCallback(
    async (emp: EmployeeItem) => {
      const isSuspended = emp.status === "SUSPENDED";
      const actionName = isSuspended ? "恢复在职" : "停用账号";
      try {
        const res = isSuspended
          ? await resumeEmployeeAction(emp.id)
          : await suspendEmployeeAction(emp.id);
        if (res.success) {
          toast.success(`员工 [${emp.name}] 已成功${actionName}`);
        } else {
          toast.error(res.error || `${actionName}失败`);
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "状态操作异常");
      }
    },
    [],
  );

  const columns: ColumnDef<EmployeeItem>[] = useMemo(
    () => [
      {
        id: "employeeInfo",
        field: EmployeeField.NAME,
        header: "员工信息",
        cell: (emp: EmployeeItem) => (
          <div className="flex items-center gap-2.5">
            {emp.avatarUrl ? (
              <img
                src={emp.avatarUrl}
                alt={emp.name}
                className="size-8 shrink-0 rounded-full object-cover border border-border/80"
              />
            ) : (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {emp.name.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-bold text-foreground truncate">{emp.name}</div>
              <div className="text-[11px] text-muted-foreground font-mono truncate">
                {emp.loginAccount || emp.email || emp.phone || "—"}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "employeeNo",
        field: EmployeeField.EMPLOYEE_NO,
        header: "员工工号",
        width: 120,
        cell: (emp: EmployeeItem) =>
          emp.employeeNo ? (
            <span className="font-mono text-xs font-semibold text-foreground">
              {emp.employeeNo}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "department",
        field: EmployeeField.DEPARTMENT_ID,
        header: "归属部门",
        width: 140,
        cell: (emp: EmployeeItem) => (
          <span className="text-xs text-foreground">
            {emp.departmentName || (
              <span className="text-muted-foreground">未分配</span>
            )}
          </span>
        ),
      },
      {
        id: "position",
        field: EmployeeField.POSITION_ID,
        header: "担任岗位",
        width: 140,
        cell: (emp: EmployeeItem) => (
          <span className="text-xs text-foreground">
            {emp.positionName || (
              <span className="text-muted-foreground">未指定</span>
            )}
          </span>
        ),
      },
      {
        id: "roles",
        header: "系统角色",
        cell: (emp: EmployeeItem) => (
          <div className="flex flex-wrap gap-1">
            {emp.roles.length > 0 ? (
              emp.roles.map((r) => (
                <Badge
                  key={r}
                  variant="outline"
                  size="sm"
                  className="text-[10px] px-1.5 py-0 h-4 font-normal"
                >
                  {r}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">无</span>
            )}
          </div>
        ),
      },
      {
        id: "status",
        field: EmployeeField.STATUS,
        header: "在职状态",
        width: 90,
        align: "center",
        cell: (emp: EmployeeItem) => {
          const isActive = emp.status === MasterDataStatus.ACTIVE;
          const isSuspended = emp.status === "SUSPENDED";
          return (
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
              {isActive ? "在职" : isSuspended ? "已停用" : "已离职"}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "操作",
        width: 160,
        align: "right",
        cell: (emp: EmployeeItem) => {
          const isActive = emp.status === MasterDataStatus.ACTIVE;
          return (
            <DataTableRowActions<EmployeeItem>
              record={emp}
              onView={() =>
                setModalState({ open: true, mode: "view", record: emp })
              }
              onEdit={() =>
                setModalState({ open: true, mode: "edit", record: emp })
              }
              onToggleStatus={() => handleToggleStatus(emp)}
              toggleStatusOptions={{
                status: emp.status,
                isActive: () => isActive,
                activeLabel: "停用",
                inactiveLabel: "恢复在职",
                confirm: (record, active) => ({
                  title: active
                    ? `确认停用员工 "${record.name}"？`
                    : `确认恢复员工 "${record.name}" 在职？`,
                  description: active
                    ? "停用后该员工将即时失去租户访问权限，账号无法登录该租户。"
                    : "恢复后该员工凭原有凭据可重新登录租户并恢复系统权限。",
                  confirmText: active ? "确认停用" : "确认恢复",
                  cancelText: "取消",
                }),
              }}
              hideDelete={true}
            />
          );
        },
      },
    ],
    [handleToggleStatus],
  );

  return (
    <>
      <div className="flex flex-col gap-6 lg:flex-row items-start">
        {/* 左栏：基于官方通用 TreeFilter 的部门组织过滤树 */}
        <div className="w-full lg:w-64 shrink-0">
          <TreeFilter
            title="部门架构过滤"
            allLabel="全公司所有员工"
            nodes={treeNodes}
            selectedId={String(list.params.departmentId ?? "") || null}
            onSelect={(id) => list.patch({ departmentId: id || "" })}
            searchPlaceholder="过滤部门..."
            cascadeToggle={{
              checked: String(list.params.includeChildren ?? "") !== "false",
              onChange: (checked) =>
                list.patch({ includeChildren: checked ? "true" : "false" }),
              label: "包含下级所有子部门",
            }}
          />
        </div>

        {/* 右栏：官方标准 DataTable 工作台 */}
        <div className="flex-1 min-w-0 w-full">
          <DataTable<EmployeeItem>
            title="企业员工档案"
            description="维护企业在职、停用与离职员工档案，支持部门级联过滤、人事调岗、调部门与角色权限分配。"
            rowKey={(emp: EmployeeItem) => emp.id}
            subject={employeePageContract.subject}
            data={data}
            columns={columns}
            total={total}
            {...list.dataTableProps}
            onCreate={() =>
              setModalState({ open: true, mode: "create", record: null })
            }
            createText="新建员工"
            keywordPlaceholder="搜索员工姓名、登录账号、工号、手机号..."
            statusOptions={[
              { value: MasterDataStatus.ACTIVE, label: "在职" },
              { value: "SUSPENDED", label: "已停用" },
              { value: "RESIGNED", label: "已离职" },
            ]}
            statusValue={String(list.params.status ?? "")}
            onStatusChange={(v) => list.patch({ status: v || "" })}
            filterExtra={
              <div className="flex items-center gap-2">
                <Combobox
                  value={String(list.params.positionId ?? "")}
                  onChange={(val) => list.patch({ positionId: val || "" })}
                  options={positions.map((p) => ({
                    value: p.id,
                    label: `${p.name} (${p.code})`,
                  }))}
                  placeholder="全部岗位"
                  searchPlaceholder="输入岗位检索..."
                  clearable
                  className="w-[150px]"
                />

                <Combobox
                  value={String(list.params.role ?? "")}
                  onChange={(val) => list.patch({ role: val || "" })}
                  options={availableRoles.map((r) => ({
                    value: r.role,
                    label: `${r.name} (${r.role})`,
                  }))}
                  placeholder="全部系统角色"
                  searchPlaceholder="输入角色检索..."
                  clearable
                  className="w-[160px]"
                />
              </div>
            }
          />
        </div>
      </div>

      {/* 官方标准三态表单弹窗 (新建 / 编辑 / 查看) */}
      {modalState.open && (
        <EmployeeFormModal
          open={modalState.open}
          mode={modalState.mode}
          record={modalState.record}
          onClose={() =>
            setModalState({ open: false, mode: "create", record: null })
          }
          onSuccess={() => {
            setModalState({ open: false, mode: "create", record: null });
          }}
          flatDepts={flatDepts}
          positions={positions}
          availableRoles={availableRoles}
          defaultDeptId={String(list.params.departmentId ?? "") || null}
        />
      )}
    </>
  );
}
