"use client";

import { useState, useMemo, useCallback } from "react";
import {
  DataTable,
  Badge,
  DataTableRowActions,
  toast,
  useListSearch,
  type ColumnDef,
} from "@base/ui";
import { ShieldAlert, ShieldCheck, KeyRound, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { TenantRoleItem } from "../types";
import {
  RoleSubject,
  roleSearchParams,
  RoleField,
} from "../contract";
import { deleteRoleAction } from "../actions";
import { RoleFormModal } from "./RoleFormModal";

export interface RoleListViewProps {
  /** 服务端角色列表数据 */
  data: TenantRoleItem[];
  /** 服务端总记录数 */
  total: number;
}

/**
 * 组织架构 - 角色字典与管理中心 (现代数智工业风)
 * 沉淀完整闭环的企业级 CRUD (Create, Read, Update, Delete) + URL-as-State (nuqs)
 */
export function RoleListView({
  data,
  total,
}: RoleListViewProps) {
  const list = useListSearch(roleSearchParams);

  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: "create" | "edit" | "view";
    record?: TenantRoleItem | null;
  }>({
    open: false,
    mode: "create",
    record: null,
  });

  const handleDelete = useCallback(
    async (roleItem: TenantRoleItem) => {
      if (roleItem.isSystem) {
        toast.error("系统内置角色严禁删除");
        return;
      }
      try {
        const res = await deleteRoleAction(roleItem.role);
        if (res.success) {
          toast.success(`角色 [${roleItem.name}] 已成功删除`);
        } else {
          toast.error(res.error || "删除角色失败");
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "删除异常");
      }
    },
    [],
  );

  const columns: ColumnDef<TenantRoleItem>[] = useMemo(
    () => [
      {
        id: "roleCode",
        field: RoleField.ROLE,
        header: "角色标识 (Role Code)",
        cell: (row: TenantRoleItem) => (
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
        field: RoleField.NAME,
        header: "角色名称",
        cell: (row: TenantRoleItem) => (
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
        field: RoleField.DESCRIPTION,
        header: "职责描述",
        cell: (row: TenantRoleItem) => (
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
        cell: (row: TenantRoleItem) => {
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
        cell: (row: TenantRoleItem) => (
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
              onView={() =>
                setModalState({ open: true, mode: "view", record: row })
              }
              onEdit={
                row.isSystem
                  ? undefined
                  : () =>
                      setModalState({ open: true, mode: "edit", record: row })
              }
              onDelete={
                row.isSystem ? undefined : () => handleDelete(row)
              }
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
    [handleDelete],
  );

  return (
    <>
      <DataTable<TenantRoleItem>
        title="企业角色管理"
        description="管理租户下的所有组织角色字典与完整生命周期，支持角色新增、重命名与描述编辑、安全删除，并直达权限配置中心编排权限矩阵"
        rowKey={(r: TenantRoleItem) => r.role}
        subject={RoleSubject}
        data={data}
        columns={columns}
        total={total}
        {...list.dataTableProps}
        onCreate={() =>
          setModalState({ open: true, mode: "create", record: null })
        }
        createText="新建业务角色"
        keywordPlaceholder="搜索角色编码、角色名称、描述..."
      />

      {modalState.open && (
        <RoleFormModal
          open={modalState.open}
          mode={modalState.mode}
          record={modalState.record}
          onClose={() =>
            setModalState({ open: false, mode: "create", record: null })
          }
          onSuccess={() => {
            setModalState({ open: false, mode: "create", record: null });
          }}
        />
      )}
    </>
  );
}
