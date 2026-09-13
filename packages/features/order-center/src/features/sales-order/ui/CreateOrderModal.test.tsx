import test from "node:test";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { CreateOrderModal } from "./CreateOrderModal";

const mockCustomers = [
  { customerCode: "CUST-001", customerName: "好味餐饮连锁" },
];

const mockStores = [
  { storeCode: "STOR-001", storeName: "朝阳一店", customerCode: "CUST-001" },
];

test("CreateOrderModal 基于 FormModal 声明式渲染订单录入与内置明细表", () => {
  const html = renderToString(
    <CreateOrderModal
      open={true}
      inline={true}
      onOpenChange={() => {}}
      onSuccess={() => {}}
      customers={mockCustomers}
      stores={mockStores}
    />,
  );

  assert.match(html, /新建销售订单/, "模态框标题应正确渲染");
  assert.match(html, /基本与配送信息/, "Card 分区应正确渲染");
  assert.match(html, /商品订购明细/, "内置明细表区域应正确渲染");
  assert.match(html, /创建销售订单/, "底栏提交按钮应正确渲染");
  assert.match(html, /添加商品明细/, "明细表添加按钮应正常呈现");
});

test("CreateOrderModal 补货模式标题渲染正常", () => {
  const html = renderToString(
    <CreateOrderModal
      open={true}
      inline={true}
      defaultOrderType="REPLENISHMENT"
      defaultOriginalOrderId="SO-20250101-0001"
      onOpenChange={() => {}}
      onSuccess={() => {}}
      customers={mockCustomers}
      stores={mockStores}
    />,
  );

  assert.match(html, /新建补货订单/, "补货模式标题应正确渲染");
});
