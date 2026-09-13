"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Send,
  CheckCircle,
  XCircle,
  Eye,
  DollarSign,
} from "lucide-react";
import {
  DataTable,
  DataTableInputGroup,
  Badge,
  DataTableRowActions,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
  useListUrlNav,
  type ColumnDef,
} from "@base/ui";
import { exportContractCsv } from "@base/shared";
import { useAbility } from "@base/authorization";
import {
  auditSalesOrderAction,
  cancelSalesOrderAction,
  markSalesOrderReadyToShipAction,
  deleteSalesOrderAction,
  getSalesOrderDetailAction,
} from "../actions";
import {
  SalesOrderField,
  salesOrderPageContract,
  SalesOrderAction,
} from "../contract";
import type { SalesOrderListItem, SalesOrderDetail } from "../types";
import { CreateOrderModal } from "./CreateOrderModal";
import { OrderDetailModal } from "./OrderDetailModal";
import { OrderFeeModal } from "./OrderFeeModal";

interface Props {
  initialOrders: SalesOrderListItem[];
  initialTotal?: number;
  initialPage?: number;
  initialPageSize?: number;
  initialKeyword?: string;
  initialStatus?: string;
  initialFulfillmentStatus?: string;
  initialOrderType?: string;
  customers: Array<{ customerCode: string; customerName: string }>;
  stores: Array<{ storeCode: string; storeName: string; customerCode: string }>;
}

const STATUS_BADGES: Record<string, { label: string; variant: any }> = {
  DRAFT: { label: "草稿", variant: "secondary" },
  PENDING: { label: "待审核", variant: "warning" },
  APPROVED: { label: "已审核", variant: "success" },
  CANCELLED: { label: "已取消", variant: "destructive" },
};

const FULFILLMENT_BADGES: Record<string, { label: string; variant: any }> = {
  PENDING_SUMMARY: { label: "待汇总", variant: "secondary" },
  PRODUCING: { label: "生产中", variant: "warning" },
  PRODUCED: { label: "生产完成", variant: "default" },
  READY_TO_SHIP: { label: "可发货", variant: "success" },
  SORTED: { label: "已分拣", variant: "outline" },
  SHIPPED: { label: "已出库", variant: "default" },
  LOADED: { label: "已装车", variant: "outline" },
  DELIVERING: { label: "配送中", variant: "warning" },
  SIGNED: { label: "已签收", variant: "success" },
};

export function SalesOrderView({
  initialOrders,
  initialTotal,
  initialPage = 1,
  initialPageSize = 10,
  initialKeyword = "",
  initialStatus = "",
  initialFulfillmentStatus = "",
  initialOrderType = "",
  customers,
  stores,
}: Props) {
  const ability = useAbility();
  const { navigateList, router } = useListUrlNav();

  const [orders, setOrders] = useState(initialOrders);
  const [total, setTotal] = useState(initialTotal ?? initialOrders.length);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [status, setStatus] = useState(initialStatus);
  const [fulfillmentStatus, setFulfillmentStatus] = useState(
    initialFulfillmentStatus,
  );
  const [orderType, setOrderType] = useState(initialOrderType);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [activeOrderDetail, setActiveOrderDetail] =
    useState<SalesOrderDetail | null>(null);
  const [, setLoading] = useState(false);

  useEffect(() => {
    setOrders(initialOrders);
    setTotal(initialTotal ?? initialOrders.length);
    setPage(initialPage);
    setPageSize(initialPageSize);
  }, [initialOrders, initialTotal, initialPage, initialPageSize]);

  const canAudit = ability.can(
    SalesOrderAction.AUDIT,
    salesOrderPageContract.subject,
  );
  const canCancel = ability.can(
    SalesOrderAction.CANCEL,
    salesOrderPageContract.subject,
  );
  const canShip = ability.can(
    SalesOrderAction.ONE_CLICK_SHIP,
    salesOrderPageContract.subject,
  );
  const canAddFee = ability.can(
    SalesOrderAction.ADD_FEE,
    salesOrderPageContract.subject,
  );
  const canAuditFee = ability.can(
    SalesOrderAction.AUDIT_FEE,
    salesOrderPageContract.subject,
  );

  const handleOpenDetail = async (orderId: string) => {
    try {
      const res = await getSalesOrderDetailAction(orderId);
      if (res.success) {
        setActiveOrderDetail(res.data);
        setDetailModalOpen(true);
      } else {
        toast.error(res.error || "加载订单详情失败");
      }
    } catch {
      toast.error("加载订单详情失败");
    }
  };

  const handleOpenFee = async (orderId: string) => {
    try {
      const res = await getSalesOrderDetailAction(orderId);
      if (res.success) {
        setActiveOrderDetail(res.data);
        setFeeModalOpen(true);
      } else {
        toast.error(res.error || "加载费用详情失败");
      }
    } catch {
      toast.error("加载费用详情失败");
    }
  };

  const handleAudit = async (orderId: string) => {
    setLoading(true);
    try {
      const res = await auditSalesOrderAction(orderId);
      if (res.success) {
        toast.success("销售订单审核通过");
        router?.refresh();
      } else {
        toast.error(res.error || "审核失败");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "审核异常");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId: string) => {
    setLoading(true);
    try {
      const res = await cancelSalesOrderAction(orderId, "用户主动取消");
      if (res.success) {
        toast.success("订单已取消");
        router?.refresh();
      } else {
        toast.error(res.error || "取消失败");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "取消异常");
    } finally {
      setLoading(false);
    }
  };

  const handleShip = async (orderId: string) => {
    setLoading(true);
    try {
      const res = await markSalesOrderReadyToShipAction(orderId);
      if (res.success) {
        toast.success("已成功标记为可发货");
        router?.refresh();
      } else {
        toast.error(res.error || "标记失败");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "标记异常");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (orderId: string) => {
    setLoading(true);
    try {
      const res = await deleteSalesOrderAction(orderId);
      if (res.success) {
        toast.success("订单已删除");
        router?.refresh();
      } else {
        toast.error(res.error || "删除失败");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "删除异常");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    exportContractCsv(orders, salesOrderPageContract.configurableFields ?? [], {
      subject: salesOrderPageContract.subject,
      ability,
      filename: "销售订单清单.csv",
    });
    toast.success("销售订单导出成功");
  };

  const columns: ColumnDef<SalesOrderListItem>[] = [
    {
      id: "orderId",
      field: SalesOrderField.ORDER_ID,
      header: "订单号",
      cell: (o: SalesOrderListItem) => (
        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-primary">
          <ShoppingCart className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{o.orderId}</span>
        </div>
      ),
    },
    {
      id: "customerName",
      field: SalesOrderField.CUSTOMER_CODE,
      header: "客户名称",
      cell: (o: SalesOrderListItem) => (
        <div className="text-xs font-medium">
          {o.customerName || o.customerCode}
        </div>
      ),
    },
    {
      id: "storeName",
      field: SalesOrderField.STORE_CODE,
      header: "门店名称",
      cell: (o: SalesOrderListItem) => (
        <div className="text-xs">{o.storeName || o.storeCode}</div>
      ),
    },
    {
      id: "orderType",
      field: SalesOrderField.ORDER_TYPE,
      header: "订单类型",
      cell: (o: SalesOrderListItem) => (
        <Badge
          variant={o.orderType === "REPLENISHMENT" ? "warning" : "secondary"}
          className="text-[11px]"
        >
          {o.orderType === "REPLENISHMENT" ? "补货" : "普通"}
        </Badge>
      ),
    },
    {
      id: "deliveryDate",
      field: SalesOrderField.DELIVERY_DATE,
      header: "交货日期",
      cell: (o: SalesOrderListItem) => (
        <div className="text-xs text-muted-foreground">{o.deliveryDate}</div>
      ),
    },
    {
      id: "itemCount",
      header: "商品行数",
      cell: (o: SalesOrderListItem) => (
        <div className="text-xs text-center font-medium">{o.itemCount}</div>
      ),
    },
    {
      id: "totalAmount",
      field: SalesOrderField.TOTAL_AMOUNT,
      header: "总金额(含税)",
      cell: (o: SalesOrderListItem) => (
        <div className="text-xs font-semibold text-primary">
          ¥{o.totalAmount.toFixed(2)}
        </div>
      ),
    },
    {
      id: "status",
      field: SalesOrderField.STATUS,
      header: "审批状态",
      cell: (o: SalesOrderListItem) => {
        const badge = STATUS_BADGES[o.status] || {
          label: o.status,
          variant: "secondary",
        };
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      id: "fulfillmentStatus",
      field: SalesOrderField.FULFILLMENT_STATUS,
      header: "履约状态",
      cell: (o: SalesOrderListItem) => {
        const badge = FULFILLMENT_BADGES[o.fulfillmentStatus] || {
          label: o.fulfillmentStatus,
          variant: "outline",
        };
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      id: "actions",
      header: "操作",
      width: 120,
      align: "right",
      cell: (o: SalesOrderListItem) => {
        const extraActions = [
          {
            label: "查看明细",
            icon: <Eye className="w-3.5 h-3.5" />,
            onClick: () => handleOpenDetail(o.orderId),
          },
          {
            label: "订单费用",
            icon: <DollarSign className="w-3.5 h-3.5" />,
            collapsed: true,
            onClick: () => handleOpenFee(o.orderId),
          },
        ];

        if (canAudit && o.status !== "APPROVED" && o.status !== "CANCELLED") {
          extraActions.push({
            label: "审核通过",
            icon: <CheckCircle className="w-3.5 h-3.5 text-success" />,
            onClick: () => handleAudit(o.orderId),
          });
        }

        if (
          canShip &&
          o.status === "APPROVED" &&
          o.fulfillmentStatus !== "READY_TO_SHIP"
        ) {
          extraActions.push({
            label: "一键发货",
            icon: <Send className="w-3.5 h-3.5 text-primary" />,
            onClick: () => handleShip(o.orderId),
          });
        }

        if (
          canCancel &&
          o.status !== "CANCELLED" &&
          o.fulfillmentStatus === "PENDING_SUMMARY"
        ) {
          extraActions.push({
            label: "取消订单",
            collapsed: true,
            icon: <XCircle className="w-3.5 h-3.5 text-destructive" />,
            onClick: () => handleCancel(o.orderId),
          });
        }

        return (
          <DataTableRowActions
            record={o}
            onView={() => handleOpenDetail(o.orderId)}
            extraActions={extraActions}
            onDelete={
              o.status === "DRAFT" ? () => handleDelete(o.orderId) : undefined
            }
            deleteConfirm={{
              title: `确认删除草稿订单 "${o.orderId}"？`,
              description: "删除后该订单明细将无法恢复。",
            }}
          />
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        data={orders}
        columns={columns}
        rowKey={(o: SalesOrderListItem) => o.orderId}
        subject={salesOrderPageContract.subject}
        title="销售订单"
        description="按客户、门店维度的配送需求订单，支持补单、多状态独立流转与费用独立核算"
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(nextPage, nextPageSize) => {
          setPage(nextPage);
          setPageSize(nextPageSize);
          navigateList({ page: nextPage, pageSize: nextPageSize });
        }}
        onRefresh={() => router?.refresh()}
        onExport={handleExport}
        onCreate={() => setCreateModalOpen(true)}
        contentProps={{ selectable: true }}
        keywordValue={keyword}
        keywordPlaceholder="订单号 / 客户 / 门店 / 销售员"
        onKeywordChange={setKeyword}
        statusOptions={[
          { value: "DRAFT", label: "草稿" },
          { value: "PENDING", label: "待审核" },
          { value: "APPROVED", label: "已审核" },
          { value: "CANCELLED", label: "已取消" },
        ]}
        statusValue={status}
        onStatusChange={(v) => {
          setStatus(v);
          setPage(1);
          navigateList({ page: 1, status: v });
        }}
        filterExtra={
          <>
            <DataTableInputGroup label="履约状态" className="w-40">
              <Select
                value={fulfillmentStatus || "ALL"}
                onValueChange={(next) => {
                  const val = next === "ALL" ? "" : next;
                  setFulfillmentStatus(val);
                  setPage(1);
                  navigateList({ page: 1, fulfillmentStatus: val });
                }}
              >
                <SelectTrigger className="h-10 border-0 bg-transparent shadow-none focus:ring-0">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="ALL">全部</SelectItem>
                    <SelectItem value="PENDING_SUMMARY">待汇总</SelectItem>
                    <SelectItem value="PRODUCING">生产中</SelectItem>
                    <SelectItem value="READY_TO_SHIP">可发货</SelectItem>
                    <SelectItem value="SHIPPED">已出库</SelectItem>
                    <SelectItem value="SIGNED">已签收</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </DataTableInputGroup>
            <DataTableInputGroup label="订单类型" className="w-36">
              <Select
                value={orderType || "ALL"}
                onValueChange={(next) => {
                  const val = next === "ALL" ? "" : next;
                  setOrderType(val);
                  setPage(1);
                  navigateList({ page: 1, orderType: val });
                }}
              >
                <SelectTrigger className="h-10 border-0 bg-transparent shadow-none focus:ring-0">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="ALL">全部</SelectItem>
                    <SelectItem value="NORMAL">普通订单</SelectItem>
                    <SelectItem value="REPLENISHMENT">补货订单</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </DataTableInputGroup>
          </>
        }
        onSearch={() => {
          setPage(1);
          navigateList({
            page: 1,
            keyword,
            status,
            fulfillmentStatus,
            orderType,
          });
        }}
        onReset={() => {
          setKeyword("");
          setStatus("");
          setFulfillmentStatus("");
          setOrderType("");
          setPage(1);
          navigateList({
            page: 1,
            keyword: "",
            status: "",
            fulfillmentStatus: "",
            orderType: "",
          });
        }}
      />

      <CreateOrderModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => router?.refresh()}
        customers={customers}
        stores={stores}
      />

      <OrderDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        order={activeOrderDetail}
      />

      <OrderFeeModal
        open={feeModalOpen}
        onOpenChange={setFeeModalOpen}
        order={activeOrderDetail}
        onRefresh={async () => {
          if (activeOrderDetail) {
            const res = await getSalesOrderDetailAction(
              activeOrderDetail.orderId,
            );
            if (res.success) {
              setActiveOrderDetail(res.data);
            }
          }
          router?.refresh();
        }}
        canAddFee={canAddFee}
        canAuditFee={canAuditFee}
      />
    </>
  );
}
