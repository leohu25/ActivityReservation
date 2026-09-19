"use client";

import { useState, useMemo, useCallback } from "react";
import { StandardAction } from "@base/authorization";
import {
  Badge,
  PageShell,
  TreeFilter,
  DataTable,
  DataTableRowActions,
  useListSearch,
  toast,
  type ColumnDef,
  type TreeNode,
  type FormModalMode,
} from "@base/ui";
import { Building, Users, FolderTree, Plus } from "lucide-react";
import type { DepartmentTreeNode } from "../types";
import {
  DepartmentField,
  departmentPageContract,
  departmentSearchParams,
} from "../department.contract";
import { deleteDepartmentAction, listDepartmentTreeAction } from "../actions";
import { DepartmentFormModal } from "./DepartmentFormModal";

export interface DepartmentViewProps {
  /** 部门树全量纯数据 */
  readonly data: readonly DepartmentTreeNode[];
}

/** 扁平化上级下拉选项（含缩进深度） */
export interface FlatDeptOption {
  readonly id: string;
  readonly name: string;
  readonly depth: number;
}

function flattenTreeForSelect(
  nodes: readonly DepartmentTreeNode[],
  depth = 0,
): FlatDeptOption[] {
  const result: FlatDeptOption[] = [];
  for (const n of nodes) {
    result.push({ id: n.id, name: n.name, depth });
    if (n.children && n.children.length > 0) {
      result.push(...flattenTreeForSelect(n.children, depth + 1));
    }
  }
  return result;
}

/** 展平成带直接父级名称的一维列表模型，供 DataTable 表格统一消费 */
export interface FlatDeptRow {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  parentName?: string;
  leaderName: string | null;
  employeeCount: number;
  childCount: number;
  raw: DepartmentTreeNode;
}

function flattenTreeWithMeta(
  nodes: readonly DepartmentTreeNode[],
  parentName?: string,
): FlatDeptRow[] {
  const result: FlatDeptRow[] = [];
  for (const n of nodes) {
    result.push({
      id: n.id,
      code: n.code,
      name: n.name,
      parentId: n.parentId,
      parentName,
      leaderName: n.leaderName ?? null,
      employeeCount: n.employeeCount,
      childCount: n.children?.length ?? 0,
      raw: n,
    });
    if (n.children && n.children.length > 0) {
      result.push(...flattenTreeWithMeta(n.children, n.name));
    }
  }
  return result;
}

function convertToFilterNodes(
  nodes: readonly DepartmentTreeNode[],
): TreeNode[] {
  return nodes.map((n) => ({
    id: n.id,
    name: n.name,
    code: n.code,
    badge: n.employeeCount > 0 ? `${n.employeeCount}人` : undefined,
    children: n.children ? convertToFilterNodes(n.children) : undefined,
  }));
}

function collectDescendantIds(
  nodes: readonly DepartmentTreeNode[],
  targetId: string,
): Set<string> {
  const ids = new Set<string>();
  const findAndCollect = (list: readonly DepartmentTreeNode[]) => {
    for (const n of list) {
      if (n.id === targetId) {
        ids.add(n.id);
        const addChildren = (children?: readonly DepartmentTreeNode[]) => {
          if (!children) return;
          for (const c of children) {
            ids.add(c.id);
            addChildren(c.children);
          }
        };
        addChildren(n.children);
        return true;
      }
      if (n.children && findAndCollect(n.children)) return true;
    }
    return false;
  };
  findAndCollect(nodes);
  return ids;
}

/**
 * 部门架构管理面板 (DepartmentView)
 * 严格遵循黄金 CRUD 范式：
 * 1. 【左树右表】布局：左侧通用 TreeFilter 组织树导航，右侧受控 DataTable 统一呈现；
 * 2. 状态由 useListSearch 驱动 URL 状态同步与持久化；
 * 3. 行操作由 DataTableRowActions 统一接管，高危撤销操作绑定 deleteConfirm 防误删；
 * 4. 三态表单由受控 DepartmentFormModal 驱动。
 */
export function DepartmentView({ data }: DepartmentViewProps) {
  const [treeData, setTreeData] =
    useState<readonly DepartmentTreeNode[]>(data);

  const list = useListSearch(departmentSearchParams);

  const [includeChildren, setIncludeChildren] = useState(true);

  // 三态弹窗状态
  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: FormModalMode;
    record: DepartmentTreeNode | null;
    defaultParentId?: string | null;
  }>({
    open: false,
    mode: "create",
    record: null,
  });

  const refreshTree = useCallback(async () => {
    const res = await listDepartmentTreeAction();
    if (res.success && res.data) {
      setTreeData(res.data);
    }
  }, []);

  const handleDelete = useCallback(
    async (deptId: string) => {
      const res = await deleteDepartmentAction(deptId);
      if (res.success) {
        toast.success("部门已成功撤销");
        await refreshTree();
      } else {
        toast.error(res.error || "撤销部门失败");
      }
    },
    [refreshTree],
  );

  const flatSelectOptions = useMemo(
    () => flattenTreeForSelect(treeData),
    [treeData],
  );
  const allRows = useMemo(() => flattenTreeWithMeta(treeData), [treeData]);
  const filterTreeNodes = useMemo(
    () => convertToFilterNodes(treeData),
    [treeData],
  );

  // 联动过滤后的表格数据行
  const filteredRows = useMemo(() => {
    let rows = allRows;
    const selectedDeptId = String(list.params.departmentId ?? "");
    const kw = String(list.params.keyword ?? "").trim().toLowerCase();

    if (selectedDeptId) {
      if (includeChildren) {
        const allowedIds = collectDescendantIds(treeData, selectedDeptId);
        rows = rows.filter((r) => allowedIds.has(r.id));
      } else {
        rows = rows.filter(
          (r) => r.id === selectedDeptId || r.parentId === selectedDeptId,
        );
      }
    }

    if (kw) {
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(kw) ||
          r.code.toLowerCase().includes(kw) ||
          (r.leaderName && r.leaderName.toLowerCase().includes(kw)),
      );
    }

    return rows;
  }, [allRows, list.params.departmentId, list.params.keyword, includeChildren, treeData]);

  // 表格列定义
  const columns: ColumnDef<FlatDeptRow>[] = useMemo(
    () => [
      {
        id: "name",
        field: DepartmentField.NAME,
        header: "部门名称",
        cell: (row) => (
          <span className="font-semibold text-foreground">{row.name}</span>
        ),
      },
      {
        id: "code",
        field: DepartmentField.CODE,
        header: "部门编码",
        width: 140,
        cell: (row) => (
          <span className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] text-foreground">
            {row.code}
          </span>
        ),
      },
      {
        id: "parentName",
        field: DepartmentField.PARENT_ID,
        header: "上级归属",
        width: 170,
        cell: (row) =>
          row.parentName ? (
            <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
              <FolderTree className="size-3" />
              {row.parentName}
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground/60">根级部门</span>
          ),
      },
      {
        id: "leaderName",
        field: DepartmentField.LEADER_MEMBER_ID,
        header: "负责人",
        width: 130,
        cell: (row) =>
          row.leaderName ? (
            <Badge variant="secondary" className="text-[10px]">
              {row.leaderName}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-[11px]">未指定</span>
          ),
      },
      {
        id: "employeeCount",
        header: "在职人数",
        width: 100,
        align: "center",
        cell: (row) => (
          <span className="font-mono font-medium text-foreground inline-flex items-center gap-1 text-xs">
            <Users className="size-3 text-muted-foreground" />
            {row.employeeCount}
          </span>
        ),
      },
      {
        id: "childCount",
        header: "下级数",
        width: 80,
        align: "center",
        cell: (row) => (
          <span className="font-mono text-muted-foreground text-xs">
            {row.childCount}
          </span>
        ),
      },
      {
        id: "actions",
        header: "操作",
        width: 180,
        align: "right",
        cell: (row) => (
          <DataTableRowActions<FlatDeptRow>
            record={row}
            onView={() =>
              setModalState({ open: true, mode: "view", record: row.raw })
            }
            onEdit={() =>
              setModalState({ open: true, mode: "edit", record: row.raw })
            }
            extraActions={[
              {
                label: "添加下级",
                action: StandardAction.CREATE,
                icon: <Plus className="size-3" />,
                onClick: () =>
                  setModalState({
                    open: true,
                    mode: "create",
                    record: null,
                    defaultParentId: row.id,
                  }),
              },
            ]}
            onDelete={() => handleDelete(row.id)}
            deleteConfirm={{
              title: `确认撤销部门 "${row.name}"？`,
              description:
                "该操作不可逆。若该部门下尚有在职员工或下级部门，系统安全门禁将拦截并禁止删除。",
              confirmText: "确认撤销",
              cancelText: "取消",
            }}
          />
        ),
      },
    ],
    [handleDelete],
  );

  return (
    <PageShell
      title="企业部门架构"
      description="支持左侧部门拓扑树联动导航与右侧 DataTable 标准化 CRUD 管理。"
      icon={<Building className="size-5 text-primary" />}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* 左侧：通用 TreeFilter 部门拓扑导航面板 */}
        <div className="lg:col-span-1">
          <TreeFilter
            title="部门组织拓扑"
            allLabel="全公司所有部门"
            totalCount={allRows.length}
            nodes={filterTreeNodes}
            selectedId={String(list.params.departmentId ?? "") || null}
            onSelect={(id) => {
              list.patch({ departmentId: id || "" });
            }}
            searchPlaceholder="搜索部门名称或编码..."
            cascadeToggle={{
              checked: includeChildren,
              onChange: (checked) => {
                setIncludeChildren(checked);
              },
              label: "包含下级所有子部门",
            }}
          />
        </div>

        {/* 右侧：官方统一 DataTable 标准工作台 */}
        <div className="lg:col-span-3">
          <DataTable<FlatDeptRow>
            data={filteredRows}
            columns={columns}
            rowKey={(r) => r.id}
            subject={departmentPageContract.subject}
            title="部门档案列表"
            description="点击左侧节点可切换过滤范围，右侧支持快捷搜索与完整 CRUD 维护。"
            total={filteredRows.length}
            {...list.dataTableProps}
            onRefresh={refreshTree}
            onCreate={() =>
              setModalState({
                open: true,
                mode: "create",
                record: null,
                defaultParentId: String(list.params.departmentId ?? "") || null,
              })
            }
            createText="新建部门"
            keywordPlaceholder="按部门名称、编码、负责人筛选..."
          />
        </div>
      </div>

      {/* 官方受控三态部门模态框 */}
      <DepartmentFormModal
        open={modalState.open}
        mode={modalState.mode}
        record={modalState.record}
        parentOptions={flatSelectOptions}
        defaultParentId={modalState.defaultParentId}
        onClose={() =>
          setModalState({ open: false, mode: "create", record: null })
        }
        onSuccess={async () => {
          setModalState({ open: false, mode: "create", record: null });
          await refreshTree();
        }}
      />
    </PageShell>
  );
}
