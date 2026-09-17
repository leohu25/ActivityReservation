import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeSearchKeyword } from "./keyword-search";

test("sanitizeSearchKeyword: 正常清洗首尾空格", () => {
  assert.equal(sanitizeSearchKeyword("  销售单号001  "), "销售单号001");
});

test("sanitizeSearchKeyword: 剔除特殊不可见控制字符", () => {
  const dirty = "客户\x00名称\x1F测试\x7F";
  assert.equal(sanitizeSearchKeyword(dirty), "客户名称测试");
});

test("sanitizeSearchKeyword: 超长字符串截断至 100 字符", () => {
  const longStr = "a".repeat(150);
  assert.equal(sanitizeSearchKeyword(longStr).length, 100);
});

test("sanitizeSearchKeyword: 非字符串与空字符串返回空", () => {
  assert.equal(sanitizeSearchKeyword(null), "");
  assert.equal(sanitizeSearchKeyword(undefined), "");
  assert.equal(sanitizeSearchKeyword(123), "");
  assert.equal(sanitizeSearchKeyword("   "), "");
});
