export type SalesOrderStatus = "DRAFT" | "PENDING" | "APPROVED" | "CANCELLED";

export type SalesOrderFulfillmentStatus =
  | "PENDING_SUMMARY"
  | "PRODUCING"
  | "PRODUCED"
  | "READY_TO_SHIP"
  | "SORTED"
  | "SHIPPED"
  | "LOADED"
  | "DELIVERING"
  | "SIGNED";

export type SalesOrderSettlementStatus =
  | "UNRECONCILED"
  | "RECONCILING"
  | "CONFIRMED"
  | "PARTIALLY_PAID"
  | "SETTLED";

export type OrderType = "NORMAL" | "REPLENISHMENT";
export type OrderSource = "MANUAL" | "API" | "APP" | "IMPORT";
export type LockStatus = "UNLOCKED" | "LOCKED";
export type FeeAuditStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";

export interface SalesOrderItemDTO {
  orderDetailId?: string;
  itemCode: string;
  itemName: string;
  salesUnit: string;
  orderQty: number;
  inboundQty?: number;
  signedQty?: number;
  fulfillmentStatus?: string;
  unitPriceExclTax: number;
  unitPriceInclTax: number;
  taxRate?: number;
  subtotalAmount?: number;
  remark?: string | null;
}

export interface SalesOrderFeeDTO {
  feeId?: string;
  orderId?: string;
  feeType: string;
  feeAmount: number;
  remark?: string | null;
  auditStatus: FeeAuditStatus;
  createdById?: string;
  auditedById?: string | null;
  auditedAt?: string | null;
  createdAt?: string;
}

export interface SalesOrderListItem {
  orderId: string;
  customerCode: string;
  storeCode: string;
  customerName?: string;
  storeName?: string;
  orderDate: string;
  deliveryDate: string;
  salesPerson?: string | null;
  customerTags?: string | null;
  department?: string | null;
  mealPeriod?: string | null;
  orderSource: string;
  orderType: string;
  originalOrderId?: string | null;
  sortingRemark?: string | null;
  routeCode?: string | null;
  driverCode?: string | null;
  lockStatus: string;
  status: string;
  fulfillmentStatus: string;
  settlementStatus: string;
  outboundStatus?: string | null;
  receiptStatus?: string | null;
  printStatus?: string | null;
  totalAmount: number;
  remark?: string | null;
  itemCount: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrderDetail extends SalesOrderListItem {
  items: SalesOrderItemDTO[];
  fees: SalesOrderFeeDTO[];
}

export interface CreateSalesOrderInput {
  customerCode: string;
  storeCode: string;
  deliveryDate: string;
  orderDate?: string;
  salesPerson?: string;
  department?: string;
  mealPeriod?: string;
  orderType?: OrderType;
  originalOrderId?: string;
  sortingRemark?: string;
  routeCode?: string;
  driverCode?: string;
  remark?: string;
  items: Array<{
    itemCode: string;
    itemName: string;
    salesUnit: string;
    orderQty: number;
    unitPriceExclTax?: number;
    unitPriceInclTax?: number;
    taxRate?: number;
    remark?: string;
  }>;
}

export interface UpdateSalesOrderInput {
  deliveryDate?: string;
  salesPerson?: string;
  department?: string;
  mealPeriod?: string;
  sortingRemark?: string;
  routeCode?: string;
  driverCode?: string;
  remark?: string;
  items?: Array<{
    itemCode: string;
    itemName: string;
    salesUnit: string;
    orderQty: number;
    unitPriceExclTax?: number;
    unitPriceInclTax?: number;
    taxRate?: number;
    remark?: string;
  }>;
}

export interface AddOrderFeeInput {
  feeType: string;
  feeAmount: number;
  remark?: string;
}

export interface ListSalesOrdersParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  customerCode?: string;
  storeCode?: string;
  status?: string;
  fulfillmentStatus?: string;
  settlementStatus?: string;
  orderType?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedSalesOrders {
  items: SalesOrderListItem[];
  total: number;
  page: number;
  pageSize: number;
}
