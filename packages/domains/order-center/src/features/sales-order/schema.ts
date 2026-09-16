import { z } from "@base/ui";

/**
 * 销售订单明细行强类型校验 Schema
 */
export const salesOrderItemSchema = z.object({
  itemCode: z.string().min(1, "商品编码不能为空"),
  itemName: z.string().min(1, "商品名称不能为空"),
  salesUnit: z.string().min(1, "销售单位不能为空"),
  orderQty: z.number().positive("订购数量必须大于 0"),
  unitPriceInclTax: z.number().min(0, "含税单价不能小于 0"),
  unitPriceExclTax: z.number().min(0, "不含税单价不能小于 0"),
  taxRate: z.number().min(0, "税率不能小于 0").optional(),
  remark: z.string().optional(),
});

/**
 * 销售订单主表录入 Schema
 */
export const salesOrderFormSchema = z.object({
  customerCode: z.string().min(1, "请选择下单客户"),
  storeCode: z.string().min(1, "请选择履约门店"),
  deliveryDate: z.string().min(1, "请选择交货日期"),
  orderType: z.enum(["NORMAL", "REPLENISHMENT"]),
  originalOrderId: z.string().optional(),
  salesPerson: z.string().optional(),
  sortingRemark: z.string().optional(),
  remark: z.string().optional(),
});

/**
 * 销售订单附加费用类型枚举
 */
export const salesOrderFeeTypeEnum = z.enum([
  "EXPRESS",
  "MATERIAL",
  "PACKAGING",
  "FREIGHT",
  "OTHER",
]);

/**
 * 销售订单附加费用表单录入 Schema
 */
export const orderFeeFormSchema = z.object({
  feeType: z.string().min(1, "请选择费用类型"),
  feeAmount: z
    .preprocess(
      (val) =>
        val === "" || val === undefined || val === null
          ? undefined
          : Number(val),
      z.union([
        z.number({ message: "请输入有效的费用金额" }),
        z.undefined(),
      ]),
    )
    .refine(
      (v) => typeof v === "number" && !isNaN(v) && v !== 0,
      "请输入有效的非零费用金额",
    ),
  remark: z.string().optional(),
});

/**
 * 销售订单详情视图只读展示 Schema
 */
export const salesOrderDetailViewSchema = z.object({
  orderId: z.string(),
  customerName: z.string(),
  storeName: z.string(),
  orderDate: z.string(),
  deliveryDate: z.string(),
  orderType: z.string(),
  mealPeriod: z.string().optional(),
  routeAndDriver: z.string().optional(),
  status: z.string(),
  fulfillmentStatus: z.string(),
  settlementStatus: z.string(),
  originalOrderId: z.string().optional(),
  remark: z.string().optional(),
});

/**
 * 销售订单费用复核 Schema
 */
export const auditSalesOrderFeeSchema = z.object({
  feeId: z.string().min(1, "费用ID不能为空"),
  auditStatus: z.enum(["APPROVED", "REJECTED"], {
    message: "请选择复核结果",
  }),
});

/**
 * 销售订单取消 Schema
 */
export const cancelSalesOrderSchema = z.object({
  orderId: z.string().min(1, "订单ID不能为空"),
  reason: z.string().optional(),
});

/**
 * 销售订单列表查询过滤参数 Schema
 */
export const listSalesOrdersQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
  keyword: z.string().optional(),
  customerCode: z.string().optional(),
  storeCode: z.string().optional(),
  status: z.string().optional(),
  fulfillmentStatus: z.string().optional(),
  settlementStatus: z.string().optional(),
  orderType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type SalesOrderFormValues = z.infer<typeof salesOrderFormSchema>;
export type SalesOrderItemFormValues = z.infer<typeof salesOrderItemSchema>;
export type OrderFeeFormValues = z.infer<typeof orderFeeFormSchema>;
export type SalesOrderDetailViewValues = z.infer<
  typeof salesOrderDetailViewSchema
>;
export type AuditSalesOrderFeeInput = z.infer<typeof auditSalesOrderFeeSchema>;
export type CancelSalesOrderInput = z.infer<typeof cancelSalesOrderSchema>;
export type ListSalesOrdersQueryParams = z.infer<
  typeof listSalesOrdersQuerySchema
>;
