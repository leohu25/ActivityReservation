"use client";

import { useState } from "react";
import type { FieldAccessMode } from "@chenrun/authorization";
import { Badge, Button, DataTable, type ColumnDef } from "@chenrun/ui";
import { CheckCheck, PackageCheck, ShoppingCart, Download } from "lucide-react";
import { ProcurementOrderStatus, ProcurementSubject } from "../permissions";
import type {
  ProcurementOrderItem,
  ProcurementAnyAbility,
  ProcurementFieldVisibility,
} from "../types";
import { CreateOrderDialog } from "./CreateOrderDialog";
import { AuditOrderModal } from "./AuditOrderModal";

export interface ProcurementOrderCenterProps {
  readonly orders: readonly ProcurementOrderItem[];
  readonly sqlWhere: Record<string, unknown>;
  readonly activeOrgId: string;
  readonly departmentName?: string | null;
  readonly canCreate: boolean;
  readonly canExport: boolean;
  readonly fieldVisibility: ProcurementFieldVisibility;
  readonly currentUserId: string;
  readonly ability?: ProcurementAnyAbility;
  readonly createFieldModes?: Record<string, FieldAccessMode>;
}

export function ProcurementOrderCenter({
  orders,
  sqlWhere,
  activeOrgId,
  departmentName,
  canCreate,
  canExport,
  fieldVisibility,
  ability,
  createFieldModes,
}: ProcurementOrderCenterProps) {
  const [selectedAuditOrder, setSelectedAuditOrder] =
    useState<ProcurementOrderItem | null>(null);

  const handleExportDummy = () => {
    alert(
      "采购数据导出遵循当前角色字段脱敏策略，成本价将依权决定是否包含在导出文件中。",
    );
  };

  // 定义业务列契约（自动关联 fieldVisibility，保留原有脱敏与显隐特性）
  const allColumns: ColumnDef<ProcurementOrderItem>[] = [
    {
      id: "orderNo",
      header: "订单编号",
      cell: (order: ProcurementOrderItem) => (
        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
          {order.orderNo}
        </span>
      ),
    },
    {
      id: "supplierName",
      header: "供应商名称",
      cell: (order: ProcurementOrderItem) => (
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {order.supplierName}
        </span>
      ),
    },
    {
      id: "quantity",
      header: "采购数量",
      cell: (order: ProcurementOrderItem) => (
        <span className="text-slate-600 dark:text-slate-400 tabular-nums">
          {order.quantity} 件
        </span>
      ),
    },
    {
      id: "costPrice",
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

  // 严格依据传入的 fieldVisibility 过滤可见列（保证与服务端推导一致）
  const activeColumns = allColumns.filter((col) => {
    if (col.id === "orderNo") return fieldVisibility.orderNo;
    if (col.id === "supplierName") return fieldVisibility.supplierName;
    if (col.id === "quantity") return fieldVisibility.quantity;
    if (col.id === "costPrice") return fieldVisibility.costPrice;
    if (col.id === "status") return fieldVisibility.status;
    if (col.id === "auditComment") return fieldVisibility.auditComment;
    return true; // 部门等公共列默认展示
  });

  return (
    <div className="space-y-4">
      {/* 头部标题与新建/导出操作 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="size-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">采购订单中心</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            按钮依权限展示、敏感成本价依字段策略控制、查询结果遵循 PostgreSQL
            动态数据范围下推，审核执行【禁止自审】红线。
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Badge variant="default" size="sm">
            <PackageCheck className="size-3 mr-1" />
            <span>CASL 动态守卫 + 物理库直连</span>
          </Badge>
          {canExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportDummy}
              className="text-xs font-semibold gap-1"
            >
              <Download className="size-3.5" />
              <span>导出数据</span>
            </Button>
          )}
          {canCreate && (
            <CreateOrderDialog
              ability={ability}
              fieldModes={createFieldModes}
              departmentName={departmentName}
            />
          )}
        </div>
      </div>

      {/* 复合积木化 DataTable */}
      <DataTable.Root
        data={orders}
        columns={activeColumns}
        rowKey={(order: ProcurementOrderItem) => order.id}
        subject={ProcurementSubject}
        ability={ability}
        total={orders.length}
      >
        <DataTable.Content />
        <DataTable.Pagination />
      </DataTable.Root>

      {/* 底部 Prisma 动态下推查询调试说明 */}
      <div className="rounded-lg border border-border/70 bg-muted/20 p-3 text-xs">
        <div className="font-semibold text-foreground mb-1">
          Prisma accessibleBy 实时下推查询条件 (当前租户: {activeOrgId})
        </div>
        <pre className="font-mono text-[11px] text-muted-foreground overflow-x-auto p-2 bg-background rounded border">
          {JSON.stringify(sqlWhere, null, 2)}
        </pre>
      </div>

      {/* 审核弹窗 */}
      {selectedAuditOrder && (
        <AuditOrderModal
          order={selectedAuditOrder}
          isOpen={Boolean(selectedAuditOrder)}
          fieldVisibility={fieldVisibility}
          onClose={() => setSelectedAuditOrder(null)}
          onAudited={() => {
            setSelectedAuditOrder(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
