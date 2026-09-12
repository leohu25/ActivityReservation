"use client";

import React, { useMemo } from "react";
import type { ControlTenantItem } from "../types";
import { DataTable, Badge, Button, type ColumnDef } from "@chenrun/ui";
import {
  Plus,
  Database,
  PauseCircle,
  PlayCircle,
  Loader2,
  Users,
  GitCommit,
  Eye,
} from "lucide-react";

export interface TenantLifecycleTableProps {
  readonly tenants: readonly ControlTenantItem[];
  readonly isPending: boolean;
  readonly onOpenProvision: () => void;
  readonly onToggleStatus: (orgId: string, currentStatus: string) => void;
  readonly onOpenDetail?: (orgId: string) => void;
}

/**
 * 租户全景生命周期运维表格组件
 * 直接采用 @chenrun/ui 的一体化白卡 DataTable.Root 组合模板，
 * 自定义行操作拓展，支持开通新租户、挂起管控与成员下钻详情，原生适配暗色与亮色模式
 */
export function TenantLifecycleTable({
  tenants,
  isPending,
  onOpenProvision,
  onToggleStatus,
  onOpenDetail,
}: TenantLifecycleTableProps): React.JSX.Element {
  const columns: ColumnDef<ControlTenantItem>[] = useMemo(
    () => [
      {
        id: "organization",
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
                ACTIVE
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
                SUSPENDED
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
        header: "企业成员",
        cell: (item: ControlTenantItem) => (
          <div className="inline-flex items-center gap-1.5 text-foreground font-semibold tabular-nums">
            <Users className="size-3.5 text-muted-foreground" />
            <span>{item.memberCount} 人</span>
          </div>
        ),
      },
      {
        id: "actions",
        header: "控制面运维",
        align: "right",
        cell: (item: ControlTenantItem) => {
          const dbStatus = item.database?.status ?? "PROVISIONING";
          return (
            <div className="inline-flex items-center justify-end gap-2">
              {onOpenDetail && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenDetail(item.id)}
                  className="gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <Eye className="size-3.5 text-muted-foreground" />
                  <span>详情 / 成员</span>
                </Button>
              )}
              {item.database ? (
                <Button
                  size="sm"
                  variant={dbStatus === "ACTIVE" ? "outline" : "default"}
                  disabled={isPending}
                  onClick={() => onToggleStatus(item.id, dbStatus)}
                  className={
                    dbStatus === "ACTIVE"
                      ? "border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  }
                >
                  {isPending ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : dbStatus === "ACTIVE" ? (
                    <PauseCircle className="size-3.5" />
                  ) : (
                    <PlayCircle className="size-3.5" />
                  )}
                  <span>{dbStatus === "ACTIVE" ? "挂起管控" : "恢复正常"}</span>
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">开通中...</span>
              )}
            </div>
          );
        },
      },
    ],
    [isPending, onOpenDetail, onToggleStatus],
  );

  return (
    <DataTable.Root
      data={tenants}
      columns={columns}
      rowKey={(item: ControlTenantItem) => item.id}
    >
      <DataTable.Header
        title="租户与独立物理数据库管控清单"
        description="实时管控各租户的独立物理库分配、Schema 迁移版本、生命周期启停与成员规模。"
        actions={
          <Button
            size="sm"
            onClick={onOpenProvision}
            className="gap-2 cursor-pointer font-bold shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>开通新租户 (Provision)</span>
          </Button>
        }
      />
      <DataTable.Content />
    </DataTable.Root>
  );
}
