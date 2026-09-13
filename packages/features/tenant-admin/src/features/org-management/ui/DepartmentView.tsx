"use client";

import { useState, useTransition, useMemo } from "react";
import { StandardAction } from "@base/authorization";
import {
  Badge,
  PageShell,
  DirectoryTreeFilter,
  DataTable,
  DataTableRowActions,
  type ColumnDef,
  type DirectoryTreeNode,
} from "@base/ui";
import { Building, Users, FolderTree } from "lucide-react";
import type { DepartmentTreeNode } from "../types";
import { DepartmentSubject } from "../department.contract";
import { deleteDepartmentAction, listDepartmentTreeAction } from "../actions";
import { DepartmentFormModal } from "./DepartmentFormModal";

export interface DepartmentViewProps {
  readonly initialTree: readonly DepartmentTreeNode[];
}

/** 扁平化部门项，用于上级下拉选择 */
interface FlatDeptOption {
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

/** 展平成带直接父级的一维列表模型，供 DataTable 使用 */
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
): DirectoryTreeNode[] {
  return nodes.map((n) => ({
    id: n.id,
    name: n.name,
    code: n.code,
    badge: n.employeeCount > 0 ? `${n.employeeCount}人` : undefined,
    children: n.children ? convertToFilterNodes(n.children) : undefined,
  }));
}

/**
 * 现代企业部门架构管理面板
 * 布局：【左树右表】
 * - 左侧：DirectoryTreeFilter 部门拓扑导航树
 * - 右侧：DataTable.Workspace 官方 CRUD 标准工作台（支持关键字、新增、编辑、删除等完整生命周期）
 */
export function DepartmentView({ initialTree }: DepartmentViewProps) {
  const [treeData, setTreeData] =
    useState<readonly DepartmentTreeNode[]>(initialTree);

  // 选中的部门 ID（null 代表“全公司所有部门”）
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [includeChildren, setIncludeChildren] = useState(true);
  const [keyword, setKeyword] = useState("");

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [modalState, setModalState] = useState<{
    mode: "create" | "edit";
    record?: DepartmentTreeNode;
    defaultParentId?: string | null;
  } | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [, startTransition] = useTransition();

  const refreshTree = async () => {
    const res = await listDepartmentTreeAction();
    if (res.success && res.data) {
      setTreeData(res.data);
    }
  };

  const openCreateModal = (defaultParentId?: string | null) => {
    setModalState({ mode: "create", defaultParentId });
    setFeedback(null);
  };

  const openEditModal = (dept: DepartmentTreeNode) => {
    setModalState({ mode: "edit", record: dept });
    setFeedback(null);
  };

  const handleDelete = async (deptId: string) => {
    startTransition(async () => {
      const res = await deleteDepartmentAction(deptId);
      if (res.success) {
        setFeedback({ type: "success", message: "部门已成功删除" });
        await refreshTree();
      } else {
        setFeedback({
          type: "error",
          message: res.error || "删除部门失败",
        });
      }
    });
  };

  const flatSelectOptions = flattenTreeForSelect(treeData);
  const allRows = useMemo(() => flattenTreeWithMeta(treeData), [treeData]);
  const filterTreeNodes = useMemo(
    () => convertToFilterNodes(treeData),
    [treeData],
  );

  // 递归收集某个节点及其所有后代节点 ID
  const collectDescendantIds = (
    nodes: readonly DepartmentTreeNode[],
    targetId: string,
  ): Set<string> => {
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
  };

  // 右侧表格过滤逻辑
  const filteredRows = useMemo(() => {
    let rows = allRows;

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

    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(kw) ||
          r.code.toLowerCase().includes(kw) ||
          (r.leaderName && r.leaderName.toLowerCase().includes(kw)),
      );
    }

    return rows;
  }, [allRows, selectedDeptId, includeChildren, keyword, treeData]);

  // 表格列定义
  const columns: ColumnDef<FlatDeptRow>[] = [
    {
      id: "name",
      header: "部门名称",
      cell: (row) => (
        <span className="font-semibold text-foreground">{row.name}</span>
      ),
    },
    {
      id: "code",
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
      header: "上级归属",
      width: 170,
      cell: (row) =>
        row.parentName ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <FolderTree className="size-3" />
            {row.parentName}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground/60">根级部门</span>
        ),
    },
    {
      id: "leaderName",
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
        <span className="font-mono font-medium text-foreground inline-flex items-center gap-1">
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
        <span className="font-mono text-muted-foreground">
          {row.childCount}
        </span>
      ),
    },
    {
      id: "actions",
      header: "操作",
      width: 150,
      align: "right",
      cell: (row) => (
        <DataTableRowActions
          record={row}
          hideView={true}
          extraActions={[
            {
              label: "添加子部门",
              action: StandardAction.CREATE,
              onClick: () => openCreateModal(row.id),
            },
          ]}
          onEdit={() => openEditModal(row.raw)}
          onDelete={() => handleDelete(row.id)}
          deleteConfirm={{
            title: `确定撤销部门 [${row.name}] 吗？`,
            description:
              "该操作不可逆。若部门下尚有在职员工或子级部门，系统将自动拦截并禁止删除。",
          }}
        />
      ),
    },
  ];

  return (
    <PageShell
      title="企业部门架构"
      description="支持左侧部门树联动导航与右侧 DataTable.Workspace 标准表格管理。"
      icon={<Building className="size-5 text-primary" />}
      feedback={feedback}
      onDismissFeedback={() => setFeedback(null)}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* 左侧：通用 DirectoryTreeFilter 部门拓扑导航面板 */}
        <div className="lg:col-span-1">
          <DirectoryTreeFilter
            title="部门组织拓扑"
            allLabel="全公司所有部门"
            totalCount={allRows.length}
            nodes={filterTreeNodes}
            selectedId={selectedDeptId}
            onSelect={(id) => {
              setSelectedDeptId(id);
              setPage(1);
            }}
            searchPlaceholder="搜索部门名称或编码..."
            cascadeToggle={{
              checked: includeChildren,
              onChange: (checked) => {
                setIncludeChildren(checked);
                setPage(1);
              },
              label: "包含下级所有子部门",
            }}
          />
        </div>

        {/* 右侧：官方统一 DataTable 标准工作台 */}
        <div className="lg:col-span-3">
          <DataTable
            data={filteredRows}
            columns={columns}
            rowKey={(r: FlatDeptRow) => r.id}
            subject={DepartmentSubject}
            title="部门档案列表"
            description="点击左侧节点可切换过滤范围，右侧支持快捷搜索与完整 CRUD 维护。"
            page={page}
            pageSize={pageSize}
            total={filteredRows.length}
            clientSidePagination={true}
            onPageChange={(p, ps) => {
              setPage(p);
              setPageSize(ps);
            }}
            onRefresh={refreshTree}
            onCreate={() => openCreateModal(selectedDeptId)}
            createText={selectedDeptId ? "新建当前子部门" : "新建部门"}
            keywordValue={keyword}
            keywordPlaceholder="按名称、编码或负责人过滤..."
            onKeywordChange={setKeyword}
            hideStatusFilter={true}
            showExport={false}
          />
        </div>
      </div>

      {/* 新建/编辑部门 Modal */}
      {modalState && (
        <DepartmentFormModal
          mode={modalState.mode}
          record={modalState.record}
          defaultParentId={modalState.defaultParentId}
          parentOptions={flatSelectOptions}
          onClose={() => setModalState(null)}
          onSaved={async () => {
            setModalState(null);
            setFeedback({
              type: "success",
              message:
                modalState.mode === "create"
                  ? "部门创建成功"
                  : "部门信息更新成功",
            });
            await refreshTree();
          }}
        />
      )}
    </PageShell>
  );
}
