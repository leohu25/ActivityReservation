import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { AuditOrderModal } from "./AuditOrderModal";
import { ProcurementOrderStatus } from "../contracts";
import type { ProcurementOrderItem } from "../types";

const mockOrder: ProcurementOrderItem = {
  id: "order-001",
  orderNo: "PO-2026-001",
  supplierName: "联想华东供应链",
  quantity: 50,
  costPrice: "5999",
  status: ProcurementOrderStatus.PENDING,
  auditComment: null,
  createdById: "user-creator",
  createdAt: new Date(),
  updatedAt: new Date(),
  deptId: "dept-001",
  departmentName: "华东采购部",
  canAuditThisOrder: true,
  isSelfAuditBlocked: false,
};

test("AuditOrderModal: open 时基于 Dialog 结构正常渲染单号、供应商与操作按钮", () => {
  const html = renderToString(
    <AuditOrderModal
      order={mockOrder}
      isOpen={true}
      inline={true}
      fieldVisibility={{
        orderNo: true,
        supplierName: true,
        quantity: true,
        costPrice: true,
        status: true,
        auditComment: true,
      }}
      onClose={() => {}}
    />,
  );

  assert.match(html, /采购单审核审批/);
  assert.match(html, /PO-2026-001/);
  assert.match(html, /联想华东供应链/);
  assert.match(html, /50.*件/);
  assert.match(html, /5999/);
  assert.match(html, /华东采购部/);
  assert.match(html, /审核驳回/);
  assert.match(html, /准予通过/);
});

test("AuditOrderModal: isSelfAuditBlocked 为 true 时展示禁止自审安全警示", () => {
  const blockedOrder: ProcurementOrderItem = {
    ...mockOrder,
    isSelfAuditBlocked: true,
    canAuditThisOrder: false,
  };

  const html = renderToString(
    <AuditOrderModal
      order={blockedOrder}
      isOpen={true}
      inline={true}
      fieldVisibility={{
        orderNo: true,
        supplierName: true,
        quantity: true,
        costPrice: true,
        status: true,
        auditComment: true,
      }}
      onClose={() => {}}
    />,
  );

  assert.match(html, /禁止自审安全警示/);
  assert.match(html, /依据业务内控红线，禁止自我审批自己创建的采购单据/);
});

test("AuditOrderModal: isOpen 为 false 且非 inline 时不渲染弹窗内容", () => {
  const html = renderToString(
    <AuditOrderModal
      order={mockOrder}
      isOpen={false}
      fieldVisibility={{
        orderNo: true,
        supplierName: true,
        quantity: true,
        costPrice: true,
        status: true,
        auditComment: true,
      }}
      onClose={() => {}}
    />,
  );

  assert.strictEqual(html, "");
});
