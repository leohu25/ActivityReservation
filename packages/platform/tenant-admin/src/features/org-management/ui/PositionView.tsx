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
import { Users } from "lucide-react";
import { exportContractCsv, MasterDataStatus } from "@base/shared";
import { useAbility } from "@base/authorization";
import {
  PositionAction,
  PositionField,
  positionPageContract,
  positionSearchParams,
} from "../position.contract";
import {
  deletePositionAction,
  togglePositionStatusAction,
} from "../actions";
import { PositionFormModal } from "./PositionFormModal";
import type { PositionItem } from "../types";

export interface PositionViewProps {
  /** 服务端岗位列表数据 */
  data: PositionItem[];
  /** 服务端总数 */
  total: number;
}

/**
 * 岗位字典管理面板组件 (现代数智工业风)
 * 严格遵循 Position != Role 物理正交解耦原则，岗位用于表达企业行政职务，不直接绑定 CASL 授权
 * 基于标准 DataTable 与 URL-as-State (nuqs) 驱动
 */
export function PositionView({
  data,
  total,
}: PositionViewProps) {

  const ability = useAbility();
  const list = useListSearch(positionSearchParams);

  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: "create" | "edit" | "view";
    record?: PositionItem | null;
  }>({
    open: false,
    mode: "create",
    record: null,
  });

  const runAction = useCallback(
    async (
      fn: () => Promise<{ success: boolean; error?: string }>,
      successText: string,
    ) => {
      try {
        const res = await fn();
        if (res.success) {
          toast.success(successText);
        } else {
          toast.error(res.error || "操作失败");
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "操作异常");
      }
    },
    [],
  );

  const handleToggleStatus = useCallback(
    (pos: PositionItem) => {
      const isCurrentlyActive = pos.status === MasterDataStatus.ACTIVE;
      void runAction(
        () => togglePositionStatusAction(pos.id),
        isCurrentlyActive ? `岗位 [${pos.name}] 已停用` : `岗位 [${pos.name}] 已启用`,
      );
    },
    [runAction],
  );

  const handleDelete = useCallback(
    (pos: PositionItem) => {
      void runAction(
        () => deletePositionAction(pos.id),
        `岗位 [${pos.name}] 已成功删除`,
      );
    },
    [runAction],
  );

  const handleExport = useCallback(() => {
    exportContractCsv(data, positionPageContract.configurableFields ?? [], {
      subject: positionPageContract.subject,
      ability,
      filename: `企业岗位字典_${new Date().toISOString().slice(0, 10)}.csv`,
      format: {
        [PositionField.STATUS]: (p) =>
          p.status === MasterDataStatus.ACTIVE ? "正常" : "已停用",
      },
    });
  }, [data, ability]);

  const columns: ColumnDef<PositionItem>[] = useMemo(
    () => [
      {
        id: "name",
        field: PositionField.NAME,
        header: "岗位名称",
        cell: (p: PositionItem) => (
          <div>
            <div className="font-medium text-foreground">{p.name}</div>
            {p.description && (
              <div
                className="text-xs text-muted-foreground line-clamp-1 max-w-sm mt-0.5"
                title={p.description}
              >
                {p.description}
              </div>
            )}
          </div>
        ),
      },
      {
        id: "code",
        field: PositionField.CODE,
        header: "岗位编码",
        width: 170,
        cell: (p: PositionItem) => (
          <span className="font-mono text-xs font-semibold text-foreground">
            {p.code}
          </span>
        ),
      },
      {
        id: "employeeCount",
        header: "在职员工数",
        width: 110,
        align: "center",
        cell: (p: PositionItem) => (
          <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-muted-foreground">
            <Users className="size-3.5" />
            {p.employeeCount} 人
          </span>
        ),
      },
      {
        id: "sort",
        field: PositionField.SORT,
        header: "排序权重",
        width: 90,
        align: "center",
        cell: (p: PositionItem) => (
          <span className="font-mono text-xs text-muted-foreground">
            {p.sort ?? 0}
          </span>
        ),
      },
      {
        id: "status",
        field: PositionField.STATUS,
        header: "状态",
        width: 90,
        align: "center",
        cell: (p: PositionItem) => (
          <Badge
            variant={
              p.status === MasterDataStatus.ACTIVE ? "success" : "secondary"
            }
            size="sm"
          >
            {p.status === MasterDataStatus.ACTIVE ? "正常" : "已停用"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "操作",
        width: 140,
        align: "right",
        cell: (p: PositionItem) => (
          <DataTableRowActions
            record={p}
            onView={() =>
              setModalState({ open: true, mode: "view", record: p })
            }
            onEdit={() =>
              setModalState({ open: true, mode: "edit", record: p })
            }
            onToggleStatus={() => handleToggleStatus(p)}
            toggleStatusOptions={{
              status: p.status,
              action: PositionAction.TOGGLE_STATUS,
              activeLabel: "停用岗位",
              inactiveLabel: "启用岗位",
              confirm: (record, active) =>
                active
                  ? {
                      title: `确认停用岗位 "${record.name}"？`,
                      description: "停用后新入职或调岗员工将无法选择该岗位。",
                      confirmText: "确认停用",
                      cancelText: "取消",
                    }
                  : undefined,
            }}
            onDelete={() => handleDelete(p)}
            deleteConfirm={{
              title: `确认删除岗位 "${p.name}"？`,
              description:
                p.employeeCount > 0
                  ? `警告：该岗位下仍有 ${p.employeeCount} 名在职员工，删除将被系统安全门禁拦截！`
                  : "删除后该岗位字典数据将不可恢复。",
            }}
          />
        ),
      },
    ],
    [handleDelete, handleToggleStatus],
  );

  return (
    <>
      <DataTable<PositionItem>
        data={data}
        columns={columns}
        rowKey={(p: PositionItem) => p.id}
        subject={positionPageContract.subject}
        title="企业岗位字典"
        description="维护企业行政职务字典，支持在职人数统计、启停管控与同级排序。岗位与系统角色权限解耦。"
        total={total}
        {...list.dataTableProps}
        onExport={handleExport}
        onCreate={() =>
          setModalState({ open: true, mode: "create", record: null })
        }
        createText="新建岗位"
        contentProps={{ selectable: true }}
        keywordPlaceholder="搜索岗位名称、编码、职责..."
        statusOptions={[
          { value: MasterDataStatus.ACTIVE, label: "正常" },
          { value: "INACTIVE", label: "已停用" },
        ]}
        statusValue={String(list.params.status ?? "")}
        onStatusChange={(v) => list.patch({ status: v || "" })}
      />

      {modalState.open && (
        <PositionFormModal
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
