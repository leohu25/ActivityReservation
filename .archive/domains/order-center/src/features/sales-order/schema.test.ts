import test from "node:test";
import assert from "node:assert/strict";
import {
  salesOrderFormSchema,
  salesOrderItemSchema,
  orderFeeFormSchema,
  salesOrderDetailViewSchema,
  auditSalesOrderFeeSchema,
  cancelSalesOrderSchema,
  listSalesOrdersQuerySchema,
} from "./schema";

test("schema: salesOrderFormSchema 校验销售订单主表数据", () => {
  const valid = {
    customerCode: "CUST-001",
    storeCode: "STOR-001",
    deliveryDate: "2025-05-01",
    orderType: "NORMAL",
  };
  const res = salesOrderFormSchema.safeParse(valid);
  assert.equal(res.success, true);

  const missingCustomer = {
    customerCode: "",
    storeCode: "STOR-001",
    deliveryDate: "2025-05-01",
    orderType: "NORMAL",
  };
  const failRes = salesOrderFormSchema.safeParse(missingCustomer);
  assert.equal(failRes.success, false);
  assert.equal(failRes.error?.issues[0]?.message, "请选择下单客户");
});

test("schema: salesOrderItemSchema 校验明细行", () => {
  const validItem = {
    itemCode: "ITM001",
    itemName: "白菜",
    salesUnit: "kg",
    orderQty: 10,
    unitPriceInclTax: 2.5,
    unitPriceExclTax: 2.5,
  };
  const res = salesOrderItemSchema.safeParse(validItem);
  assert.equal(res.success, true);

  const invalidQty = {
    ...validItem,
    orderQty: -1,
  };
  const failRes = salesOrderItemSchema.safeParse(invalidQty);
  assert.equal(failRes.success, false);
  assert.equal(failRes.error?.issues[0]?.message, "订购数量必须大于 0");
});

test("schema: orderFeeFormSchema 校验费用录入，支持正负数并拦截 0 与空值", () => {
  // 正应收
  const posRes = orderFeeFormSchema.safeParse({
    feeType: "FREIGHT",
    feeAmount: 50.5,
  });
  assert.equal(posRes.success, true);
  if (posRes.success) {
    assert.equal(posRes.data.feeAmount, 50.5);
  }

  // 负折让
  const negRes = orderFeeFormSchema.safeParse({
    feeType: "PACKAGING",
    feeAmount: -20,
  });
  assert.equal(negRes.success, true);
  if (negRes.success) {
    assert.equal(negRes.data.feeAmount, -20);
  }

  // 字符串数字转换
  const strRes = orderFeeFormSchema.safeParse({
    feeType: "EXPRESS",
    feeAmount: "35",
  });
  assert.equal(strRes.success, true);
  if (strRes.success) {
    assert.equal(strRes.data.feeAmount, 35);
  }

  // 0 拦截
  const zeroRes = orderFeeFormSchema.safeParse({
    feeType: "FREIGHT",
    feeAmount: 0,
  });
  assert.equal(zeroRes.success, false);
  assert.equal(zeroRes.error?.issues[0]?.message, "请输入有效的非零费用金额");

  // 空字符串拦截
  const emptyRes = orderFeeFormSchema.safeParse({
    feeType: "FREIGHT",
    feeAmount: "",
  });
  assert.equal(emptyRes.success, false);
  assert.equal(emptyRes.error?.issues[0]?.message, "请输入有效的非零费用金额");

  // 缺少费用类型
  const noTypeRes = orderFeeFormSchema.safeParse({
    feeType: "",
    feeAmount: 10,
  });
  assert.equal(noTypeRes.success, false);
  assert.equal(noTypeRes.error?.issues[0]?.message, "请选择费用类型");
});

test("schema: salesOrderDetailViewSchema 校验只读详情视图", () => {
  const validDetail = {
    orderId: "SO-001",
    customerName: "客户A",
    storeName: "门店A",
    orderDate: "2025-05-01",
    deliveryDate: "2025-05-02",
    orderType: "普通订单",
    status: "APPROVED",
    fulfillmentStatus: "待汇总",
    settlementStatus: "UNRECONCILED",
  };
  const res = salesOrderDetailViewSchema.safeParse(validDetail);
  assert.equal(res.success, true);
});

test("schema: auditSalesOrderFeeSchema 与 cancelSalesOrderSchema", () => {
  const auditRes = auditSalesOrderFeeSchema.safeParse({
    feeId: "fee-1",
    auditStatus: "APPROVED",
  });
  assert.equal(auditRes.success, true);

  const invalidAudit = auditSalesOrderFeeSchema.safeParse({
    feeId: "fee-1",
    auditStatus: "UNKNOWN",
  });
  assert.equal(invalidAudit.success, false);

  const cancelRes = cancelSalesOrderSchema.safeParse({
    orderId: "SO-1",
    reason: "客户要求取消",
  });
  assert.equal(cancelRes.success, true);
});

test("schema: listSalesOrdersQuerySchema 默认值与边界校验", () => {
  const res = listSalesOrdersQuerySchema.safeParse({});
  assert.equal(res.success, true);
  if (res.success) {
    assert.equal(res.data.page, 1);
    assert.equal(res.data.pageSize, 10);
  }
});
