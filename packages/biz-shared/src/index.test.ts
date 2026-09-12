import test from "node:test";
import assert from "node:assert/strict";
import {
  formatBusinessDocNo,
  bizAuditActionSchema,
  BizApprovalStatus,
} from "./index";

test("formatBusinessDocNo 正常按前缀与序列号生成单号", () => {
  const fixedDate = new Date("2026-09-12T00:00:00Z");
  const docNo = formatBusinessDocNo("PO", 1, fixedDate);
  assert.equal(docNo, "PO-20260912-0001");
});

test("bizAuditActionSchema 校验通过与拒绝", () => {
  const valid = bizAuditActionSchema.parse({
    action: "APPROVE",
    comment: "同意审批",
  });
  assert.equal(valid.action, "APPROVE");
  assert.equal(BizApprovalStatus.APPROVED, "APPROVED");
});
