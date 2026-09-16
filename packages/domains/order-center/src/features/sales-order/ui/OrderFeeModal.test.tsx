import test from "node:test";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { OrderFeeModal } from "./OrderFeeModal";
import type { SalesOrderDetail } from "../types";

const mockOrderWithFees: SalesOrderDetail = {
  orderId: "SO-20250501-0002",
  customerCode: "CUST-002",
  customerName: "鲜百味配送中心",
  storeCode: "STOR-002",
  storeName: "海淀二店",
  orderDate: "2025-05-01",
  deliveryDate: "2025-05-02",
  orderType: "NORMAL",
  orderSource: "MANUAL",
  status: "APPROVED",
  fulfillmentStatus: "READY_TO_SHIP",
  settlementStatus: "UNRECONCILED",
  lockStatus: "UNLOCKED",
  totalAmount: 500,
  itemCount: 1,
  createdById: "user-1",
  createdAt: "2025-05-01T10:00:00Z",
  updatedAt: "2025-05-01T10:30:00Z",
  items: [],
  fees: [
    {
      feeId: "fee-1",
      orderId: "SO-20250501-0002",
      feeType: "FREIGHT",
      feeAmount: 50,
      remark: "同城冷链冷藏运费",
      auditStatus: "PENDING",
      createdById: "dispatcher-1",
    },
    {
      feeId: "fee-2",
      orderId: "SO-20250501-0002",
      feeType: "PACKAGING",
      feeAmount: -10,
      remark: "保温箱押金抵扣",
      auditStatus: "APPROVED",
      createdById: "dispatcher-1",
    },
  ],
};

test("OrderFeeModal 具备添加权限时渲染录入表单、明细表与提交按钮", () => {
  const html = renderToString(
    <OrderFeeModal
      open={true}
      inline={true}
      onOpenChange={() => {}}
      order={mockOrderWithFees}
      onRefresh={() => {}}
      canAddFee={true}
      canAuditFee={false}
    />,
  );

  assert.match(html, /订单附加费用管理 - SO-20250501-0002/, "模态框标题应正确渲染");
  assert.match(html, /录入附加费用/, "录入分区标题应渲染");
  assert.match(html, /费用类型/, "字段标签应渲染");
  assert.match(html, /金额 \(正应收\/负折让\)/, "金额标签应渲染");
  assert.match(html, /添加费用项/, "提交按钮应正确渲染");

  // 明细列表渲染
  assert.match(html, /已录入费用明细 \(2\)/, "费用明细标题及数量应渲染");
  assert.match(html, /运费/, "费用类型映射文案应正确渲染");
  assert.match(html, /同城冷链冷藏运费/, "费用备注应渲染");
  assert.match(html, /包装费/, "第二个费用项应渲染");
  assert.match(html, /待复核/, "待复核徽标应渲染");
  assert.match(html, /已复核/, "已复核徽标应渲染");
});

test("OrderFeeModal 具备复核权限时在明细行渲染通过与驳回操作按钮", () => {
  const html = renderToString(
    <OrderFeeModal
      open={true}
      inline={true}
      onOpenChange={() => {}}
      order={mockOrderWithFees}
      onRefresh={() => {}}
      canAddFee={false}
      canAuditFee={true}
    />,
  );

  assert.match(html, /通过/, "待复核费用应渲染通过按钮");
  assert.match(html, /驳回/, "待复核费用应渲染驳回按钮");
  // canAddFee=false 时为 view 模式，不渲染录入分区与提交按钮
  assert.doesNotMatch(html, /录入附加费用/, "无添加权限时不应渲染录入分区");
  assert.doesNotMatch(html, /添加费用项/, "无添加权限时不应渲染提交按钮");
  assert.match(html, /关闭/, "只读查看模式应渲染关闭按钮");
});

test("OrderFeeModal 当 order 为 null 时安全返回空", () => {
  const html = renderToString(
    <OrderFeeModal
      open={true}
      inline={true}
      onOpenChange={() => {}}
      order={null}
      onRefresh={() => {}}
      canAddFee={true}
      canAuditFee={true}
    />,
  );

  assert.equal(html, "", "order 为 null 时应不渲染任何内容");
});
