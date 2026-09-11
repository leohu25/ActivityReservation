"use client";

import React, { useState } from "react";
import { useAbility, type FieldAccessMode } from "@chenrun/authorization";
import { Badge, Button, DataTable, type ColumnDef } from "@chenrun/ui";
import { CheckCheck, PackageCheck } from "lucide-react";
import {
  ProcurementOrderField,
  ProcurementOrderStatus,
  procurementOrderPageContract,
} from "../contracts";
import type {
  ProcurementOrderItem,
  ProcurementFieldVisibility,
} from "../types";
import { CreateOrderDialog } from "./CreateOrderDialog";
import { AuditOrderModal } from "./AuditOrderModal";

export interface ProcurementOrderCenterProps {
  readonly orders: readonly ProcurementOrderItem[];
  readonly sqlWhere?: Record<string, unknown>;
  readonly activeOrgId?: string;
  readonly departmentName?: string | null;
  readonly canCreate?: boolean;
  readonly canExport?: boolean;
  readonly fieldVisibility?: ProcurementFieldVisibility;
  readonly currentUserId?: string;
  readonly createFieldModes?: Record<string, FieldAccessMode>;
}

/**
 * 采购订单中心：Ability 来自上层 AbilityProvider（procurement layout）。
 * 服务端仍可显式下发 canCreate/canExport/fieldVisibility（真实例编译结果）。
 */
export function ProcurementOrderCenter({
  orders,
  sqlWhere = {},
  activeOrgId = "",
  departmentName,
  canCreate: explicitCanCreate,
  canExport: explicitCanExport,
  fieldVisibility,
  createFieldModes,
}: ProcurementOrderCenterProps) {
  const [selectedAuditOrder, setSelectedAuditOrder] =
    useState<ProcurementOrderItem | null>(null);

  const ability = useAbility();
  const subject = procurementOrderPageContract.subject;

  // Fail-Closed：未显式传入时，无 ability 一律拒绝
  const canExport =
    explicitCanExport === undefined
      ? ability.can("export", subject)
      : explicitCanExport;

  const canCreate =
    explicitCanCreate === undefined
      ? ability.can("create", subject)
      : explicitCanCreate;

  const handleExport = () => {
    const fieldKeys = [
      {
        key: "orderNo" as const,
        field: ProcurementOrderField.ORDER_NO,
        label: "订单编号",
      },
      {
        key: "supplierName" as const,
        field: ProcurementOrderField.SUPPLIER_NAME,
        label: "供应商名称",
      },
      {
        key: "quantity" as const,
        field: ProcurementOrderField.QUANTITY,
        label: "采购数量",
      },
      {
        key: "costPrice" as const,
        field: ProcurementOrderField.COST_PRICE,
        label: "采购成本单价",
      },
      {
        key: "status" as const,
        field: ProcurementOrderField.STATUS,
        label: "状态",
      },
      {
        key: "auditComment" as const,
        field: ProcurementOrderField.AUDIT_COMMENT,
        label: "审核意见",
      },
    ];

    // 过滤掉当前操作员无权访问 (HIDDEN) 的字段
    const activeExportFields = fieldKeys.filter((f) => {
      if (fieldVisibility && fieldVisibility[f.key] === false) return false;
      if (!f.field) return true;
      return ability.can("read", subject, f.field);
    });

    const csvContent = [
      activeExportFields.map((f) => f.label).join(","),
      ...orders.map((o) =>
        activeExportFields
          .map((f) => {
            const val = o[f.key];
            if (val === null || val === undefined) return "";
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(","),
      ),
    ].join("\n");

    if (typeof window !== "undefined" && typeof Blob !== "undefined") {
      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `采购订单_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // 定义业务列契约（显式挂载 field: ProcurementOrderField.XXX，受控列必带身份证）
  const allColumns: ColumnDef<ProcurementOrderItem>[] = [
    {
      id: "orderNo",
      field: ProcurementOrderField.ORDER_NO,
      header: "订单编号",
      cell: (order: ProcurementOrderItem) => (
        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
          {order.orderNo}
        </span>
      ),
    },
    {
      id: "supplierName",
      field: ProcurementOrderField.SUPPLIER_NAME,
      header: "供应商名称",
      cell: (order: ProcurementOrderItem) => (
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {order.supplierName}
        </span>
      ),
    },
    {
      id: "quantity",
      field: ProcurementOrderField.QUANTITY,
      header: "采购数量",
      cell: (order: ProcurementOrderItem) => (
        <span className="text-slate-600 dark:text-slate-400 tabular-nums">
          {order.quantity} 件
        </span>
      ),
    },
    {
      id: "costPrice",
      field: ProcurementOrderField.COST_PRICE,
      header: "采购单价 (敏感资产)",
      cell: (order: ProcurementOrderItem) => (
        <span className="font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
          {order.costPrice}
        </span>
      ),
    },
    {
      id: "department",
      header: "归属部门",
      cell: (order: ProcurementOrderItem) => (
        <span className="text-slate-600 dark:text-slate-400">
          {order.departmentName || order.deptId}
        </span>
      ),
    },
    {
      id: "status",
      field: ProcurementOrderField.STATUS,
      header: "状态",
      cell: (order: ProcurementOrderItem) => {
        if (order.status === ProcurementOrderStatus.APPROVED) {
          return (
            <Badge variant="success" size="sm">
              已通过
            </Badge>
          );
        }
        if (order.status === ProcurementOrderStatus.REJECTED) {
          return (
            <Badge variant="destructive" size="sm">
              已驳回
            </Badge>
          );
        }
        return (
          <Badge variant="warning" size="sm">
            待审核
          </Badge>
        );
      },
    },
    {
      id: "auditComment",
      field: ProcurementOrderField.AUDIT_COMMENT,
      header: "审核意见",
      cell: (order: ProcurementOrderItem) => (
        <span className="text-slate-500 dark:text-slate-400">
          {order.auditComment || "-"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "操作",
      width: 100,
      align: "right",
      cell: (order: ProcurementOrderItem) => {
        if (order.canAuditThisOrder) {
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedAuditOrder(order)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold dark:text-blue-400 h-7 px-2"
            >
              <CheckCheck className="size-3.5 mr-1" />
              <span>审批</span>
            </Button>
          );
        }
        if (order.isSelfAuditBlocked) {
          return (
            <span
              title="您是本单据创建人，依据内控规范禁止自审"
              className="inline-flex items-center text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-400 cursor-help"
            >
              禁止自审
            </span>
          );
        }
        return <span className="text-slate-400 text-xs">-</span>;
      },
    },
  ];

  // 严格过滤可见列（双重保障：fieldVisibility 模式或 ability 契约模式）
  const activeColumns = allColumns.filter((col) => {
    // 1. 若外部传入 fieldVisibility 映射表，优先遵守
    if (fieldVisibility) {
      if (col.id === "orderNo") return fieldVisibility.orderNo;
      if (col.id === "supplierName") return fieldVisibility.supplierName;
      if (col.id === "quantity") return fieldVisibility.quantity;
      if (col.id === "costPrice") return fieldVisibility.costPrice;
      if (col.id === "status") return fieldVisibility.status;
      if (col.id === "auditComment") return fieldVisibility.auditComment;
    }
    // 2. 否则按官方 AbilityProvider 判定
    if (col.field) {
      return ability.can("read", subject, col.field);
    }
    return true; // 部门、操作等公共列默认展示
  });

  return (
    <div className="space-y-4">
      <DataTable.Workspace
        data={orders}
        columns={activeColumns}
        rowKey={(order: ProcurementOrderItem) => order.id}
        subject={subject}
        title="采购订单中心"
        description="按钮依权限展示、敏感成本价依字段策略控制、查询结果遵循 PostgreSQL 动态数据范围下推，审核执行【禁止自审】红线。"
        showFilterBar={false}
        showRefresh={false}
        showCreate={false}
        exportText="导出数据"
        onExport={handleExport}
        toolbarExtra={
          <>
            <Badge variant="default" size="sm">
              <PackageCheck className="size-3 mr-1" />
              <span>CASL 动态守卫 + 物理库直连</span>
            </Badge>
            {canCreate && (
              <CreateOrderDialog
                ability={ability}
                fieldModes={createFieldModes}
                departmentName={departmentName}
              />
            )}
          </>
        }
        total={orders.length}
      >
        {/* 审核弹窗 */}
        {selectedAuditOrder && (
          <AuditOrderModal
            order={selectedAuditOrder}
            isOpen={Boolean(selectedAuditOrder)}
            fieldVisibility={
              fieldVisibility ?? {
                orderNo: true,
                supplierName: true,
                quantity: true,
                costPrice: true,
                status: true,
                auditComment: true,
              }
            }
            onClose={() => setSelectedAuditOrder(null)}
            onAudited={() => {
              setSelectedAuditOrder(null);
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            }}
          />
        )}
      </DataTable.Workspace>

      {/* 底部 Prisma 动态下推查询调试说明 */}
      {activeOrgId && (
        <div className="rounded-lg border border-border/70 bg-muted/20 p-3 text-xs">
          <div className="font-semibold text-foreground mb-1">
            Prisma accessibleBy 实时下推查询条件 (当前租户: {activeOrgId})
          </div>
          <pre className="font-mono text-[11px] text-muted-foreground overflow-x-auto p-2 bg-background rounded border">
            {JSON.stringify(sqlWhere, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
