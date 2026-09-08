import test from "node:test";
import assert from "node:assert/strict";
import { defineAbility, ForbiddenError } from "@casl/ability";
import {
  getFieldMode,
  getReadableFields,
  getEditableFields,
  pickReadableFields,
  assertEditableFields,
} from "./field-policy";

test("getFieldMode 正确推导 HIDDEN、READONLY 与 EDITABLE 三态属性", () => {
  const ability = defineAbility((can) => {
    can("read", "PurchaseOrder", ["orderNo", "costPrice", "supplierName"]);
    can("update", "PurchaseOrder", ["supplierName"]);
    // costPrice 仅可读不可改 -> READONLY
    // supplierName 可读且可改 -> EDITABLE
    // remark 未声明任何权限 -> HIDDEN
  });

  assert.equal(getFieldMode(ability, "PurchaseOrder", "supplierName"), "EDITABLE");
  assert.equal(getFieldMode(ability, "PurchaseOrder", "costPrice"), "READONLY");
  assert.equal(getFieldMode(ability, "PurchaseOrder", "remark"), "HIDDEN");
});

test("getReadableFields 与 getEditableFields 返回被授权的字段子集", () => {
  const ability = defineAbility((can) => {
    can("read", "PurchaseOrder", ["id", "title", "costPrice"]);
    can("update", "PurchaseOrder", ["title"]);
  });

  const readable = getReadableFields(ability, "PurchaseOrder", ["id", "title", "costPrice", "secretNote"]);
  assert.deepEqual(readable.sort(), ["costPrice", "id", "title"]);

  const editable = getEditableFields(ability, "PurchaseOrder", ["id", "title", "costPrice"]);
  assert.deepEqual(editable, ["title"]);
});

test("pickReadableFields 过滤对象并剥离隐藏敏感字段", () => {
  const ability = defineAbility((can) => {
    can("read", "PurchaseOrder", ["id", "title"]);
  });

  const record = {
    id: "po_1",
    title: "办公用品采购",
    costPrice: 99.99,
    internalSecret: "商业机密",
  };

  const masked = pickReadableFields(ability, "PurchaseOrder", record);
  assert.deepEqual(masked, {
    id: "po_1",
    title: "办公用品采购",
  });
});

test("assertEditableFields 允许合法可编辑字段并拦截只读或隐藏字段变更", () => {
  const ability = defineAbility((can) => {
    can("read", "PurchaseOrder", ["title", "costPrice"]);
    can("update", "PurchaseOrder", ["title"]);
  });

  // 合法更新：仅包含可编辑字段
  assert.doesNotThrow(() => {
    assertEditableFields(ability, "PurchaseOrder", {
      title: "更新后的采购订单",
    });
  });

  // 越权拦截：试图修改 READONLY 字段 costPrice，触发 ForbiddenError 拒绝
  assert.throws(
    () => {
      assertEditableFields(ability, "PurchaseOrder", {
        costPrice: 50.0,
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ForbiddenError);
      assert.match((err as Error).message, /禁止修改 PurchaseOrder 的非编辑或隐藏字段: costPrice/);
      return true;
    },
  );

  // 越权拦截：试图修改 HIDDEN 字段 secretNote，触发 ForbiddenError 拒绝
  assert.throws(
    () => {
      assertEditableFields(ability, "PurchaseOrder", {
        secretNote: "恶意注入",
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ForbiddenError);
      assert.match((err as Error).message, /禁止修改 PurchaseOrder 的非编辑或隐藏字段: secretNote/);
      return true;
    },
  );
});
