"use client";

import React, { useMemo, useState } from "react";
import { exportContractCsv } from "@base/shared";
import { useAbility, type FieldAccessMode } from "@base/authorization";
import {
  Badge,
  Button,
  DataTable,
  useSafeRouter,
  type ColumnDef,
} from "@base/ui";
import { CheckCheck } from "lucide-react";
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
  sqlWhere: _sqlWhere = {},
  activeOrgId: _activeOrgId = "",
  departmentName,
  canCreate: explicitCanCreate,
  canExport: _explicitCanExport,
  fieldVisibility,
  createFieldModes,
}: ProcurementOrderCenterProps) {
  const router = useSafeRouter();
  const [selectedAuditOrder, setSelectedAuditOrder] =
    useState<ProcurementOrderItem | null>(null);

  const [keyword, setKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const ability = useAbility();
  const subject = procurementOrderPageContract.subject;

  const canCreate =
    explicitCanCreate === undefined
      ? ability.can("create", subject)
      : explicitCanCreate;

  const handleExport = () => {
    exportContractCsv(
      filteredOrders,
      procurementOrderPageContract.configurableFields ?? [],
      {
        subject,
        ability,
        filename: `采购订单_${new Date().toISOString().slice(0, 10)}.csv`,
        format: {
          [ProcurementOrderField.STATUS]: (o: ProcurementOrderItem) =>
            o.status === ProcurementOrderStatus.APPROVED
              ? "已通过"
              : o.status === ProcurementOrderStatus.REJECTED
                ? "已驳回"
                : "待审核",
          [ProcurementOrderField.COST_PRICE]: (o: ProcurementOrderItem) =>
            String(o.costPrice ?? "-"),
        },
      },
    );
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

  // 前端即时搜索与状态过滤（当页面无需全页重载时，兼顾即时响应）
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (selectedStatus && o.status !== selectedStatus) {
        return false;
      }
      if (keyword.trim()) {
        const q = keyword.trim().toLowerCase();
        const matchNo = o.orderNo
          ? String(o.orderNo).toLowerCase().includes(q)
          : false;
        const matchSupplier = o.supplierName
          ? String(o.supplierName).toLowerCase().includes(q)
          : false;
        return matchNo || matchSupplier;
      }
      return true;
    });
  }, [orders, keyword, selectedStatus]);

  return (
    <div className="space-y-4">
      <DataTable.Workspace
        data={filteredOrders}
        columns={activeColumns}
        rowKey={(order: ProcurementOrderItem) => order.id}
        subject={subject}
        title="采购订单中心"
        description="管理企业采购订单、跟踪审批流程与物料采购明细"
        showFilterBar={true}
        showRefresh={true}
        showCreate={false}
        onRefresh={() => router?.refresh()}
        keywordValue={keyword}
        keywordPlaceholder="单号 / 供应商"
        onKeywordChange={setKeyword}
        statusOptions={[
          { value: ProcurementOrderStatus.PENDING, label: "待审核" },
          { value: ProcurementOrderStatus.APPROVED, label: "已通过" },
          { value: ProcurementOrderStatus.REJECTED, label: "已驳回" },
        ]}
        statusValue={selectedStatus}
        onStatusChange={setSelectedStatus}
        onReset={() => {
          setKeyword("");
          setSelectedStatus("");
        }}
        exportText="导出数据"
        onExport={handleExport}
        toolbarExtra={
          canCreate ? (
            <CreateOrderDialog
              ability={ability}
              fieldModes={createFieldModes}
              departmentName={departmentName}
            />
          ) : undefined
        }
        total={filteredOrders.length}
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
              router?.refresh();
            }}
          />
        )}
      </DataTable.Workspace>
    </div>
  );
}
