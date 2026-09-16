import {
  STANDARD_DATA_SCOPES,
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@base/authorization";
import type { SearchContract } from "@base/shared";

// 1. 实体与资源标识 (CASL Subject & Resource)
export const SalesOrderSubject = "SalesOrder";
export type SalesOrderSubject = typeof SalesOrderSubject;
export const SalesOrderResource = "order.sales_order";
export type SalesOrderResource = typeof SalesOrderResource;

// 2. 字段字典枚举 (消除魔法字符串)
export const SalesOrderField = {
  ORDER_ID: "orderId",
  CUSTOMER_CODE: "customerCode",
  STORE_CODE: "storeCode",
  ORDER_DATE: "orderDate",
  DELIVERY_DATE: "deliveryDate",
  SALES_PERSON: "salesPerson",
  CUSTOMER_TAGS: "customerTags",
  DEPARTMENT: "department",
  MEAL_PERIOD: "mealPeriod",
  ORDER_SOURCE: "orderSource",
  ORDER_TYPE: "orderType",
  ORIGINAL_ORDER_ID: "originalOrderId",
  SORTING_REMARK: "sortingRemark",
  ROUTE_CODE: "routeCode",
  DRIVER_CODE: "driverCode",
  LOCK_STATUS: "lockStatus",
  STATUS: "status",
  FULFILLMENT_STATUS: "fulfillmentStatus",
  SETTLEMENT_STATUS: "settlementStatus",
  OUTBOUND_STATUS: "outboundStatus",
  RECEIPT_STATUS: "receiptStatus",
  PRINT_STATUS: "printStatus",
  TOTAL_AMOUNT: "totalAmount",
  REMARK: "remark",
} as const;

// 3. 受控字段元数据定义
export const salesOrderConfigurableFields = [
  { field: SalesOrderField.ORDER_ID, label: "销售订单号", isSensitive: false },
  {
    field: SalesOrderField.CUSTOMER_CODE,
    label: "客户编码",
    isSensitive: false,
  },
  { field: SalesOrderField.STORE_CODE, label: "门店编码", isSensitive: false },
  { field: SalesOrderField.ORDER_DATE, label: "下单日期", isSensitive: false },
  {
    field: SalesOrderField.DELIVERY_DATE,
    label: "交货日期",
    isSensitive: false,
  },
  { field: SalesOrderField.SALES_PERSON, label: "销售员", isSensitive: false },
  { field: SalesOrderField.ORDER_TYPE, label: "订单类型", isSensitive: false },
  {
    field: SalesOrderField.ORIGINAL_ORDER_ID,
    label: "关联原单号",
    isSensitive: false,
  },
  { field: SalesOrderField.LOCK_STATUS, label: "锁定状态", isSensitive: false },
  { field: SalesOrderField.STATUS, label: "审批状态", isSensitive: false },
  {
    field: SalesOrderField.FULFILLMENT_STATUS,
    label: "履约状态",
    isSensitive: false,
  },
  {
    field: SalesOrderField.SETTLEMENT_STATUS,
    label: "结算状态",
    isSensitive: false,
  },
  {
    field: SalesOrderField.TOTAL_AMOUNT,
    label: "订单总金额",
    isSensitive: true,
  },
] as const;

// 4. 自定义业务操作动作
export const SalesOrderAction = {
  ...StandardAction,
  AUDIT: "audit",
  CANCEL: "cancel",
  ONE_CLICK_SHIP: "one_click_ship",
  ADD_FEE: "add_fee",
  AUDIT_FEE: "audit_fee",
} as const;

// 5. 页面级纯数据权限契约 (SSoT)
export const salesOrderPageContract: FeaturePagePermissionDescriptor = {
  resource: SalesOrderResource,
  subject: SalesOrderSubject,
  label: "销售订单管理",
  path: "/order/sales-orders",
  actions: [
    {
      action: StandardAction.READ,
      label: "查看订单",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
    { action: StandardAction.CREATE, label: "新建订单" },
    {
      action: StandardAction.UPDATE,
      label: "修改订单",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
    { action: StandardAction.DELETE, label: "删除订单" },
    { action: StandardAction.EXPORT, label: "数据导出" },
    { action: SalesOrderAction.AUDIT, label: "审核订单" },
    { action: SalesOrderAction.CANCEL, label: "取消订单" },
    { action: SalesOrderAction.ONE_CLICK_SHIP, label: "一键发货标记" },
    { action: SalesOrderAction.ADD_FEE, label: "录入费用" },
    { action: SalesOrderAction.AUDIT_FEE, label: "复核费用" },
  ],
  configurableFields: salesOrderConfigurableFields.map((f) => ({
    field: f.field,
    label: f.label,
    sensitive: f.isSensitive,
  })),
} as const;

// 6. 搜索契约 SSoT：声明直接字段与穿透关联反查，驱动前端输入框占位符与后端参数化检索
export const salesOrderSearchContract: SearchContract = {
  direct: [
    { field: "orderId", label: "订单号" },
    { field: "salesPerson", label: "销售员" },
  ],
  relations: [
    {
      targetField: "customerCode",
      relationModel: "customer",
      searchField: "customerName",
      label: "客户",
    },
    {
      targetField: "storeCode",
      relationModel: "customerStore",
      searchField: "storeName",
      label: "门店",
    },
  ],
} as const;
