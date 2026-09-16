"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  FormModal,
  Badge,
  Button,
  toast,
  type DetailTableColumn,
  type FormModalSection,
  type FormFieldSchema,
} from "@base/ui";
import { addSalesOrderFeeAction, auditSalesOrderFeeAction } from "../actions";
import { orderFeeFormSchema, type OrderFeeFormValues } from "../schema";
import type { SalesOrderDetail, SalesOrderFeeDTO } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: SalesOrderDetail | null;
  onRefresh: () => void;
  canAddFee: boolean;
  canAuditFee: boolean;
  inline?: boolean;
}

const FEE_TYPE_LABELS: Record<string, string> = {
  EXPRESS: "快递费",
  MATERIAL: "材料费",
  PACKAGING: "包装费",
  FREIGHT: "运费",
  OTHER: "其他费用",
};

const AUDIT_STATUS_BADGES: Record<
  string,
  {
    label: string;
    variant: "secondary" | "warning" | "success" | "destructive";
  }
> = {
  DRAFT: { label: "草稿", variant: "secondary" },
  PENDING: { label: "待复核", variant: "warning" },
  APPROVED: { label: "已复核", variant: "success" },
  REJECTED: { label: "已驳回", variant: "destructive" },
};

export function OrderFeeModal({
  open,
  onOpenChange,
  order,
  onRefresh,
  canAddFee,
  canAuditFee,
  inline = false,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleAudit = async (
    feeId: string,
    status: "APPROVED" | "REJECTED",
  ) => {
    setLoading(true);
    try {
      const res = await auditSalesOrderFeeAction(feeId, status);
      if (res.success) {
        toast.success(status === "APPROVED" ? "费用复核已通过" : "费用已驳回");
        onRefresh();
      } else {
        toast.error(res.error || "操作失败");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "操作异常");
    } finally {
      setLoading(false);
    }
  };

  const formFields: FormFieldSchema[] = useMemo(
    () => [
      {
        name: "feeType",
        label: "费用类型",
        type: "select",
        required: true,
        options: Object.entries(FEE_TYPE_LABELS).map(([k, v]) => ({
          value: k,
          label: v,
        })),
      },
      {
        name: "feeAmount",
        label: "金额 (正应收/负折让)",
        type: "number",
        required: true,
        step: "0.01",
        placeholder: "0.00",
      },
      {
        name: "remark",
        label: "费用缘由/说明",
        type: "text",
        placeholder: "如冷链包材费",
      },
    ],
    [],
  );

  const sections: FormModalSection[] = useMemo(() => {
    if (!canAddFee) return [];
    return [
      {
        title: "录入附加费用",
        description:
          "选择费用类型并输入金额（正数为额外应收，负数为折扣折让）",
        columns: 3,
        fields: formFields,
      },
    ];
  }, [canAddFee, formFields]);

  const detailColumns: DetailTableColumn<SalesOrderFeeDTO>[] = useMemo(() => {
    const cols: DetailTableColumn<SalesOrderFeeDTO>[] = [
      {
        id: "feeType",
        header: "费用类型",
        width: 120,
        renderCell: (fee) => (
          <span className="font-medium text-xs">
            {FEE_TYPE_LABELS[fee.feeType] || fee.feeType}
          </span>
        ),
      },
      {
        id: "feeAmount",
        header: "费用金额",
        width: 120,
        renderCell: (fee) => (
          <span
            className={`font-semibold text-xs ${
              fee.feeAmount >= 0 ? "text-primary" : "text-destructive"
            }`}
          >
            {fee.feeAmount >= 0
              ? `+¥${fee.feeAmount.toFixed(2)}`
              : `-¥${Math.abs(fee.feeAmount).toFixed(2)}`}
          </span>
        ),
      },
      {
        id: "auditStatus",
        header: "复核状态",
        width: 100,
        renderCell: (fee) => {
          const badge = AUDIT_STATUS_BADGES[fee.auditStatus] || {
            label: fee.auditStatus,
            variant: "secondary" as const,
          };
          return (
            <Badge variant={badge.variant} className="text-[10px]">
              {badge.label}
            </Badge>
          );
        },
      },
      {
        id: "remark",
        header: "备注说明",
        renderCell: (fee) => (
          <span className="text-xs text-muted-foreground">
            {fee.remark || "-"}
          </span>
        ),
      },
      {
        id: "createdById",
        header: "操作人",
        width: 110,
        renderCell: (fee) => (
          <span className="text-xs text-muted-foreground">
            {fee.createdById || "-"}
          </span>
        ),
      },
    ];

    if (canAuditFee) {
      cols.push({
        id: "actions",
        header: "复核操作",
        width: 160,
        align: "right",
        renderCell: (fee) => {
          if (fee.auditStatus === "APPROVED") return null;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-success"
                disabled={loading}
                onClick={async (e) => {
                  e.stopPropagation();
                  await handleAudit(fee.feeId!, "APPROVED");
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                通过
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive"
                disabled={loading}
                onClick={async (e) => {
                  e.stopPropagation();
                  await handleAudit(fee.feeId!, "REJECTED");
                }}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                驳回
              </Button>
            </div>
          );
        },
      });
    }

    return cols;
  }, [canAuditFee, loading]);

  if (!order) return null;

  return (
    <FormModal<OrderFeeFormValues, SalesOrderFeeDTO>
      open={open}
      onOpenChange={onOpenChange}
      onClose={() => onOpenChange(false)}
      mode={canAddFee ? "create" : "view"}
      inline={inline}
      badge="FEE"
      title={`订单附加费用管理 - ${order.orderId}`}
      description="录入运费、包装费、包材等附加费用，支持主管在线复核"
      schema={orderFeeFormSchema}
      sections={sections}
      initialValues={{
        feeType: "FREIGHT",
        feeAmount: "" as unknown as number,
        remark: "",
      }}
      detailConfig={{
        title: `已录入费用明细 (${order.fees.length})`,
        description: "展示订单附加费用明细与在线复核状态",
        columns: detailColumns,
        readOnly: true,
        emptyText: "暂无附加费用记录",
      }}
      items={order.fees}
      initialItems={order.fees}
      onSubmit={
        canAddFee
          ? async (values) => {
              const res = await addSalesOrderFeeAction(order.orderId, {
                feeType: values.feeType,
                feeAmount: Number(values.feeAmount),
                remark: values.remark || undefined,
              });
              if (!res.success) {
                throw new Error(res.error || "录入费用失败");
              }
              toast.success("费用录入成功");
              onRefresh();
            }
          : undefined
      }
      submitText="添加费用项"
    />
  );
}
