import test from "node:test";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { OrderDetailModal } from "./OrderDetailModal";
import type { SalesOrderDetail } from "../types";

const mockOrder: SalesOrderDetail = {
  orderId: "SO-20250501-0001",
  customerCode: "CUST-001",
  customerName: "好味餐饮连锁",
  storeCode: "STOR-001",
  storeName: "朝阳一店",
  orderDate: "2025-05-01",
  deliveryDate: "2025-05-02",
  orderType: "NORMAL",
  orderSource: "MANUAL",
  status: "APPROVED",
  fulfillmentStatus: "READY_TO_SHIP",
  settlementStatus: "UNRECONCILED",
  lockStatus: "UNLOCKED",
  totalAmount: 350.5,
  itemCount: 2,
  createdById: "user-1",
  createdAt: "2025-05-01T10:00:00Z",
  updatedAt: "2025-05-01T10:30:00Z",
  remark: "急单请尽快配送",
  items: [
    {
      orderDetailId: "item-1",
      itemCode: "VEG-001",
      itemName: "有机生菜",
      salesUnit: "kg",
      orderQty: 10,
      unitPriceInclTax: 15.5,
      unitPriceExclTax: 15.5,
      subtotalAmount: 155,
      fulfillmentStatus: "READY_TO_SHIP",
    },
    {
      orderDetailId: "item-2",
      itemCode: "VEG-002",
      itemName: "优质番茄",
      salesUnit: "kg",
      orderQty: 15,
      unitPriceInclTax: 13.0,
      unitPriceExclTax: 13.0,
      subtotalAmount: 195.5,
      fulfillmentStatus: "READY_TO_SHIP",
    },
  ],
  fees: [],
};

test("OrderDetailModal 基于 FormModal mode='view' 渲染单头只读字段与只读内置明细表", () => {
  const html = renderToString(
    <OrderDetailModal
      open={true}
      inline={true}
      onOpenChange={() => {}}
      order={mockOrder}
    />,
  );

  // 1. 标题与头部徽标渲染
  assert.match(html, /订单详情 - SO-20250501-0001/, "模态框标题应包含单据编号");
  assert.match(html, /SO/, "头部徽章应渲染");

  // 2. 单头基本与履约分区字段渲染（只读禁填）
  assert.match(html, /基础与履约信息/, "分区标题应正确渲染");
  assert.match(html, /好味餐饮连锁 \(CUST-001\)/, "客户信息应正确回填展示");
  assert.match(html, /朝阳一店 \(STOR-001\)/, "门店信息应正确回填展示");
  assert.match(html, /2025-05-02/, "交期应正确回填展示");
  assert.match(html, /可发货/, "履约状态应通过映射表翻译呈现");

  // 3. 内置 DetailTable 明细表区域渲染
  assert.match(html, /商品明细 \(2\)/, "明细表标题与品项数量应正确展示");
  assert.match(html, /有机生菜/, "商品名称应正确渲染");
  assert.match(html, /VEG-001/, "商品编码应正确渲染");
  assert.match(html, /优质番茄/, "第二项商品名称应正确渲染");
  assert.match(html, /总计金额/, "底栏金额小计应正确渲染");
  assert.match(html, /350\.50/, "订单总金额应格式化呈现");

  // 4. view 模式安全约束：只读展示，严禁渲染新增按钮或提交修改按钮
  assert.doesNotMatch(html, /添加商品明细/, "view 模式绝不渲染添加明细按钮");
  assert.doesNotMatch(html, /立即创建/, "view 模式绝不渲染创建按钮");
  assert.doesNotMatch(html, /保存修改/, "view 模式绝不渲染保存按钮");
  assert.match(html, /关闭/, "view 模式必须渲染关闭按钮");
});

test("OrderDetailModal 当 order 为 null 时安全防崩溃返回空", () => {
  const html = renderToString(
    <OrderDetailModal
      open={true}
      inline={true}
      onOpenChange={() => {}}
      order={null}
    />,
  );

  assert.equal(html, "", "order 为 null 时应不渲染任何内容");
});
