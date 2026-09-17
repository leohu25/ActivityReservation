"use client";

import { useState, useMemo, useTransition, useEffect } from "react";
import {
  DataTable,
  Badge,
  DataTableRowActions,
  toast,
  ConfirmDialog,
  useListUrlNav,
  type ColumnDef,
} from "@base/ui";
import { ShieldAlert, ShieldCheck, KeyRound, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useAbility } from "@base/authorization";
import type { TenantRoleItem } from "../types";
import { RoleSubject } from "../contract";
import { deleteRoleAction, listRolesAction } from "../actions";
import { CreateRoleModal } from "./CreateRoleModal";
import { EditRoleModal } from "./EditRoleModal";

export interface RoleListViewProps {
  readonly initialRoles: readonly TenantRoleItem[];
  readonly initialTotal?: number;
  readonly initialPage?: number;
  readonly initialPageSize?: number;
  readonly initialKeyword?: string;
}

/**
 * 组织架构 - 角色字典与管理中心 (现代数智工业风)
 * 沉淀完整闭环的企业级 CRUD (Create, Read, Update, Delete) + 服务端分页与搜索下推
 */
export function RoleListView({
  initialRoles,
  initialTotal,
  initialPage = 1,
  initialPageSize = 10,
  initialKeyword = "",
}: RoleListViewProps) {
  const ability = useAbility();
  const canCreate = ability.can("create", RoleSubject);
  const canUpdate = ability.can("update", RoleSubject);
  const canDelete = ability.can("delete", RoleSubject);

  const { navigateList, router } = useListUrlNav();

  const [roles, setRoles] = useState<readonly TenantRoleItem[]>(initialRoles);
  const [total, setTotal] = useState(initialTotal ?? initialRoles.length);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [keyword, setKeyword] = useState(initialKeyword);

  // 当 Server Component 传入更新的 Props 时同步
  useEffect(() => {
    setRoles(initialRoles);
    setTotal(initialTotal ?? initialRoles.length);
    setPage(initialPage);
    setPageSize(initialPageSize);
    setKeyword(initialKeyword);
  }, [
    initialRoles,
    initialTotal,
    initialPage,
    initialPageSize,
    initialKeyword,
  ]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<TenantRoleItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TenantRoleItem | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const refreshRoles = async (
    curPage = page,
    curSize = pageSize,
    curKw = keyword,
  ) => {
    const res = await listRolesAction({
      page: curPage,
      pageSize: curSize,
      keyword: curKw.trim() || undefined,
    });
    if (res.success && res.data) {
      setRoles(res.data.items);
      setTotal(res.data.total);
      setPage(res.data.page);
      setPageSize(res.data.pageSize);
    }
  };

  const handleSearch = () => {
    navigateList({
      page: 1,
      pageSize,
      keyword: keyword.trim() || undefined,
    });
    refreshRoles(1, pageSize, keyword);
  };

  const handleReset = () => {
    setKeyword("");
    navigateList({
      page: 1,
      pageSize,
      keyword: undefined,
    });
    refreshRoles(1, pageSize, "");
  };

  const handlePageChange = (nextPage: number, nextPageSize: number) => {
    setPage(nextPage);
    setPageSize(nextPageSize);
    navigateList({
      page: nextPage,
      pageSize: nextPageSize,
      keyword: keyword.trim() || undefined,
    });
    refreshRoles(nextPage, nextPageSize, keyword);
  };

  const handleDelete = (roleItem: TenantRoleItem) => {
    if (roleItem.isSystem) {
      toast.error("系统内置角色严禁删除");
      return;
    }
    setDeleteTarget(roleItem);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    startDeleteTransition(async () => {
      const res = await deleteRoleAction(deleteTarget.role);
      if (res.success) {
        toast.success(`角色 [${deleteTarget.name}] 已成功删除`);
        setDeleteTarget(null);
        await refreshRoles();
      } else {
        toast.error(res.error || "删除角色失败");
      }
    });
  };

  const columns: ColumnDef<TenantRoleItem>[] = useMemo(
    () => [
      {
        id: "roleCode",
        header: "角色标识 (Role Code)",
        cell: (row) => (
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              {row.isSystem ? (
                <ShieldAlert className="size-3.5" />
              ) : (
                <ShieldCheck className="size-3.5" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                {row.role}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {row.isSystem ? "系统预置身份" : "自定义业务角色"}
              </span>
            </div>
          </div>
        ),
      },
      {
        id: "name",
        header: "角色名称",
        cell: (row) => (
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {row.name}
            </span>
            {row.isSystem ? (
              <Badge
                variant="outline"
                size="sm"
                className="border-blue-200 bg-blue-50 text-[10px] font-medium text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300"
              >
                内置受保护
              </Badge>
            ) : (
              <Badge
                variant="outline"
                size="sm"
                className="border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              >
                自定义
              </Badge>
            )}
          </div>
        ),
      },
      {
        id: "description",
        header: "职责描述",
        cell: (row) => (
          <span
            className="text-xs text-muted-foreground truncate max-w-[320px] inline-block"
            title={row.description || ""}
          >
            {row.description || "-"}
          </span>
        ),
      },
      {
        id: "status",
        header: "权限编排状态",
        cell: (row) => {
          const statementKeys = Object.keys(row.permissions?.statement ?? {});
          const hasPolicies = statementKeys.length > 0;
          return (
            <div className="flex items-center gap-1.5">
              <span
                className={`size-2 rounded-full ${
                  hasPolicies ? "bg-emerald-500" : "bg-amber-400"
                }`}
              />
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {hasPolicies
                  ? `已分配 ${statementKeys.length} 项资源策略`
                  : "待配置权限矩阵"}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "操作",
        cell: (row) => (
          <div className="flex items-center gap-2">
            <Link
              href="/settings/roles"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
            >
              <KeyRound className="size-3" />
              <span>配置权限</span>
              <ExternalLink className="size-2.5 opacity-60" />
            </Link>

            <DataTableRowActions<TenantRoleItem>
              record={row}
              hideView
              hideEdit={row.isSystem || !canUpdate}
              hideDelete={row.isSystem || !canDelete}
              onEdit={(r) => setEditingRole(r)}
              onDelete={() => handleDelete(row)}
              deleteConfirm={{
                title: `确认删除业务角色 [${row.name}] 吗？`,
                description:
                  "删除角色将导致该角色下已绑定的员工失去对应角色身份及所有关联授权，操作不可逆，请谨慎确认！",
                confirmText: "确认删除",
              }}
            />
          </div>
        ),
      },
    ],
    [canUpdate, canDelete],
  );

  return (
    <div className="space-y-4">
      <DataTable
        category="ORGANIZATION & ROLES"
        title="企业角色管理"
        description="管理租户下的所有组织角色字典与完整生命周期，支持角色新增、重命名与描述编辑、安全删除，并直达权限配置中心编排权限矩阵"
        rowKey={(r) => r.role}
        subject={RoleSubject}
        data={roles as TenantRoleItem[]}
        columns={columns}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={handlePageChange}
        showRefresh
        showCreate={canCreate}
        createText="新建业务角色"
        onCreate={() => setIsCreateOpen(true)}
        onRefresh={() => {
          router?.refresh();
          refreshRoles();
        }}
        showKeywordFilter
        keywordPlaceholder="搜索角色编码、角色名称、描述..."
        keywordValue={keyword}
        onKeywordChange={setKeyword}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      {/* 新增角色标准 FormModal */}
      {isCreateOpen && (
        <CreateRoleModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={async () => {
            setIsCreateOpen(false);
            await refreshRoles(1, pageSize, keyword);
          }}
        />
      )}

      {/* 编辑角色标准 FormModal */}
      {editingRole && (
        <EditRoleModal
          role={editingRole}
          onClose={() => setEditingRole(null)}
          onUpdated={async () => {
            setEditingRole(null);
            await refreshRoles();
          }}
        />
      )}

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`确认删除业务角色 [${deleteTarget?.name || ""}] 吗？`}
        description="删除角色将导致该角色下已绑定的员工失去对应角色身份及所有关联授权，操作不可逆，请谨慎确认！"
        confirmText={isDeleting ? "正在删除..." : "确认永久删除"}
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
