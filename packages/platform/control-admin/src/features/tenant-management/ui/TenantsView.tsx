"use client";

import React, { useState, useTransition, useMemo, useCallback } from "react";
import {
  DataTable,
  DataTableRowActions,
  Badge,
  useListSearch,
  toast,
  type ColumnDef,
} from "@base/ui";
import {
  Database,
  Users,
  GitCommit,
  Loader2,
  Key,
} from "lucide-react";
import type {
  ControlTenantItem,
  ControlTenantDetail,
  GetTenantMembersQuery,
  ProvisionTenantResult,
} from "../types";
import {
  toggleTenantStatusAction,
  getTenantDetailAction,
} from "../actions";
import {
  TenantManagementSubject,
  TenantManagementField,
  tenantManagementPageContract,
  tenantSearchParams,
} from "../contract";
import { TenantFormModal } from "./TenantFormModal";
import { TenantDetailDrawer } from "./TenantDetailDrawer";

export interface TenantsViewProps {
  /** 租户列表及其物理库生命周期状态纯数据 */
  readonly data: readonly ControlTenantItem[];
  readonly total?: number;
}

/**
 * 控制平面租户运维管控主视图 (TenantsView)
 * 全面遵循黄金 CRUD 范式与受控模式：
 * 1. 列表由受控 DataTable + useListSearch 驱动，URL 同步分页与检索；
 * 2. 行操作由官方 DataTableRowActions 接管：
 *    - onView / onEdit: 唤起全景抽屉查看成员与拓扑；
 *    - onToggleStatus: 原生内置物理库状态切换（挂起管控/恢复正常）；
 * 3. 租户开通由受控三态 TenantFormModal 驱动；
 * 4. 彻底删除手写裸表格 TenantLifecycleTable 与独立拼装弹窗。
 */
export function TenantsView({
  data,
  total = data.length,
}: TenantsViewProps): React.JSX.Element {
  const [, startTransition] = useTransition();

  const list = useListSearch(tenantSearchParams);

  // 抽屉详情状态
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedTenantDetail, setSelectedTenantDetail] =
    useState<ControlTenantDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // 三态开通/查看模态框
  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: "create" | "view";
    record: ControlTenantItem | null;
  }>({
    open: false,
    mode: "create",
    record: null,
  });

  // 开通成功后凭据展示
  const [provisionSuccessCredential, setProvisionSuccessCredential] =
    useState<ProvisionTenantResult | null>(null);

  const loadTenantDetail = useCallback(
    (orgId: string, page = 1, search = "") => {
      setIsDetailLoading(true);
      startTransition(async () => {
        const res = await getTenantDetailAction(orgId, {
          page,
          pageSize: 8,
          search,
        });
        setIsDetailLoading(false);
        if (res.success && res.data) {
          setSelectedTenantDetail(res.data);
        } else if (!res.success) {
          toast.error(res.error || "获取租户详情失败");
        }
      });
    },
    [],
  );

  const handleOpenDetail = useCallback(
    (orgId: string) => {
      setSelectedOrgId(orgId);
      setIsDrawerOpen(true);
      setSelectedTenantDetail(null);
      loadTenantDetail(orgId, 1, "");
    },
    [loadTenantDetail],
  );

  const handleFetchMembers = useCallback(
    (page: number, search: string) => {
      if (!selectedOrgId) return;
      loadTenantDetail(selectedOrgId, page, search);
    },
    [selectedOrgId, loadTenantDetail],
  );

  const handleToggleStatus = useCallback(
    async (item: ControlTenantItem) => {
      const res = await toggleTenantStatusAction(item.id);
      if (res.success) {
        toast.success(`租户 [${item.name}] 状态已平滑更新为: ${res.data}`);
      } else {
        toast.error(res.error || "切换租户状态失败");
      }
    },
    [],
  );

  const columns: ColumnDef<ControlTenantItem>[] = useMemo(
    () => [
      {
        id: "organization",
        field: TenantManagementField.NAME,
        header: "租户组织 / Slug",
        cell: (item: ControlTenantItem) => (
          <div>
            <div className="font-bold text-foreground text-sm">{item.name}</div>
            <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
              slug: {item.slug}
            </div>
          </div>
        ),
      },
      {
        id: "database",
        field: TenantManagementField.DATABASE_NAME,
        header: "独立物理数据库 (Database-per-Tenant)",
        cell: (item: ControlTenantItem) =>
          item.database?.databaseName ? (
            <div className="inline-flex items-center gap-1.5 rounded-lg border bg-muted/40 px-2.5 py-1 font-mono text-xs font-semibold text-foreground">
              <Database className="size-3 text-blue-600 dark:text-blue-400" />
              <span>{item.database.databaseName}</span>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              待初始化分配
            </span>
          ),
      },
      {
        id: "migration",
        field: TenantManagementField.SCHEMA_VERSION,
        header: "Schema 版本 (Migration)",
        cell: (item: ControlTenantItem) => (
          <div>
            <div className="flex items-center gap-1 font-mono font-bold text-foreground tabular-nums">
              <GitCommit className="size-3 text-muted-foreground" />
              <span>v{item.database?.schemaVersion ?? 0}</span>
            </div>
            {item.latestMigration && (
              <span
                className="block text-[10px] text-muted-foreground mt-0.5 truncate max-w-[200px]"
                title={item.latestMigration.migrationName}
              >
                {item.latestMigration.migrationName}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "status",
        field: TenantManagementField.STATUS,
        header: "物理库生命周期",
        cell: (item: ControlTenantItem) => {
          const dbStatus = item.database?.status ?? "PROVISIONING";
          if (dbStatus === "ACTIVE") {
            return (
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1.5 text-xs font-bold"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                正常运行 (ACTIVE)
              </Badge>
            );
          }
          if (dbStatus === "SUSPENDED") {
            return (
              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1.5 text-xs font-bold"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                已挂起管控 (SUSPENDED)
              </Badge>
            );
          }
          return (
            <Badge
              variant="outline"
              className="border-destructive/30 bg-destructive/10 text-destructive gap-1.5 text-xs font-bold"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
              {dbStatus}
            </Badge>
          );
        },
      },
      {
        id: "members",
        field: TenantManagementField.MEMBER_COUNT,
        header: "企业成员",
        width: 120,
        cell: (item: ControlTenantItem) => (
          <div className="inline-flex items-center gap-1.5 text-foreground font-semibold tabular-nums text-xs">
            <Users className="size-3.5 text-muted-foreground" />
            <span>{item.memberCount} 人</span>
          </div>
        ),
      },
      {
        id: "actions",
        header: "控制面运维",
        width: 180,
        align: "right",
        cell: (item: ControlTenantItem) => {
          const dbStatus = item.database?.status ?? "PROVISIONING";
          const isActive = dbStatus === "ACTIVE";
          return (
            <DataTableRowActions<ControlTenantItem>
              record={item}
              onView={() => handleOpenDetail(item.id)}
              onToggleStatus={item.database ? () => handleToggleStatus(item) : undefined}
              toggleStatusOptions={{
                status: dbStatus,
                isActive: () => isActive,
                activeLabel: "挂起管控",
                inactiveLabel: "恢复正常",
                confirm: (record, active) => ({
                  title: active
                    ? `确认挂起租户 [${record.name}] 的物理库？`
                    : `确认恢复租户 [${record.name}] 的正常访问？`,
                  description: active
                    ? "挂起后该租户的所有业务请求与登录鉴权将被 Access Gate 物理级阻断。"
                    : "恢复后该租户的独立物理库将重新接入动态连接池并恢复正常业务。",
                  confirmText: active ? "确认挂起" : "确认恢复",
                  cancelText: "取消",
                }),
              }}
              hideDelete={true}
            />
          );
        },
      },
    ],
    [handleOpenDetail, handleToggleStatus],
  );

  return (
    <>
      <DataTable<ControlTenantItem>
        data={data}
        columns={columns}
        rowKey={(item) => item.id}
        subject={TenantManagementSubject}
        title="租户与独立物理数据库管控清单"
        description="实时管控各租户的独立物理库分配、Schema 迁移版本、生命周期启停与成员规模。"
        total={total}
        {...list.dataTableProps}
        onCreate={() =>
          setModalState({ open: true, mode: "create", record: null })
        }
        createText="开通新租户"
        keywordPlaceholder="搜索租户全称、Slug 或物理数据库名..."
        statusOptions={[
          { value: "ACTIVE", label: "正常运行 (ACTIVE)" },
          { value: "SUSPENDED", label: "已挂起管控 (SUSPENDED)" },
          { value: "PROVISIONING", label: "开通中 (PROVISIONING)" },
        ]}
        statusValue={String(list.params.status ?? "")}
        onStatusChange={(v) => list.patch({ status: v || "" })}
      />

      {/* 租户开通受控模态框 */}
      <TenantFormModal
        open={modalState.open}
        mode={modalState.mode}
        record={modalState.record}
        onClose={() =>
          setModalState({ open: false, mode: "create", record: null })
        }
        onSuccess={(result) => {
          setModalState({ open: false, mode: "create", record: null });
          if (result) {
            setProvisionSuccessCredential(result);
          }
        }}
      />

      {/* 开通成功初始凭据提示卡片（仅一次性安全呈现） */}
      {provisionSuccessCredential && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-card border border-border shadow-2xl rounded-xl p-4 flex flex-col gap-2.5 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Key className="size-4 text-emerald-500" />
            <span>新租户已开通，请妥善保存初始管理员凭据</span>
          </div>
          <div className="bg-muted/60 p-2.5 rounded font-mono text-xs text-foreground flex flex-col gap-1">
            <div>租户Slug: {provisionSuccessCredential.slug}</div>
            <div>物理数据库: {provisionSuccessCredential.databaseName}</div>
            {provisionSuccessCredential.initialPassword ? (
              <div>
                初始密码:{" "}
                <span className="text-destructive font-bold">
                  {provisionSuccessCredential.initialPassword}
                </span>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setProvisionSuccessCredential(null)}
            className="self-end text-xs text-muted-foreground hover:text-foreground cursor-pointer underline"
          >
            我已保存并关闭
          </button>
        </div>
      )}

      {/* 全景成员与运维下钻抽屉 */}
      <TenantDetailDrawer
        isOpen={isDrawerOpen}
        isLoading={isDetailLoading}
        tenantDetail={selectedTenantDetail}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedOrgId(null);
          setSelectedTenantDetail(null);
        }}
        onFetchMembers={handleFetchMembers}
      />
    </>
  );
}
