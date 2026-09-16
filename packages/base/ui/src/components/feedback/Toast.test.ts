import test from "node:test";
import assert from "node:assert/strict";
import { toast, Toaster } from "./Toast";

test("Toast & Toaster: 正确从 @base/ui 导出通知组件与工具", () => {
  assert.equal(typeof toast, "function");
  assert.equal(typeof toast.success, "function");
  assert.equal(typeof toast.error, "function");
  assert.equal(typeof toast.warning, "function");
  assert.equal(typeof toast.info, "function");
  assert.equal(typeof Toaster, "function");
});
