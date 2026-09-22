import test from "node:test";
import assert from "node:assert/strict";
import { defineAbility, ForbiddenError } from "@casl/ability";
import {
  getFieldMode,
  getReadableFields,
  getEditableFields,
  isFieldAllowedForAction,
  pickReadableFields,
  assertEditableFields,
  resolveFieldAccess,
} from "./field-policy";

test("resolveFieldAccess 单点推导三态（显式策略优先，否则按动作）", () => {
  assert.equal(resolveFieldAccess({ explicit: "READONLY" }), "READONLY");
  assert.equal(resolveFieldAccess({ hasWrite: true, hasRead: true }), "EDITABLE");
  assert.equal(resolveFieldAccess({ hasRead: true }), "READONLY");
  assert.equal(resolveFieldAccess({}), "HIDDEN");
});

test("isFieldAllowedForAction 与 CASL 字段规则对齐", () => {
  const policies = {
    secret: "HIDDEN",
    remark: "READONLY",
    name: "EDITABLE",
  } as const;

  assert.equal(isFieldAllowedForAction(policies, "read", "secret"), false);
  assert.equal(isFieldAllowedForAction(policies, "read", "remark"), true);
  assert.equal(isFieldAllowedForAction(policies, "update", "remark"), false);
  assert.equal(isFieldAllowedForAction(policies, "update", "name"), true);
  assert.equal(isFieldAllowedForAction(policies, "read", "unlisted"), true);
  assert.equal(isFieldAllowedForAction(policies, "read", undefined), true);
});

test("getFieldMode 正确推导 HIDDEN、READONLY 与 EDITABLE 三态属性", () => {
  const ability = defineAbility((can) => {
    can("read", "Customer", ["orderNo", "costPrice", "supplierName"]);
    can("update", "Customer", ["supplierName"]);
    // costPrice 仅可读不可改 -> READONLY
    // supplierName 可读且可改 -> EDITABLE
    // remark 未声明任何权限 -> HIDDEN
  });

  assert.equal(
    getFieldMode(ability, "Customer", "supplierName"),
    "EDITABLE",
  );
  assert.equal(getFieldMode(ability, "Customer", "costPrice"), "READONLY");
  assert.equal(getFieldMode(ability, "Customer", "remark"), "HIDDEN");
});

test("getReadableFields 与 getEditableFields 返回被授权的字段子集", () => {
  const ability = defineAbility((can) => {
    can("read", "Customer", ["id", "title", "costPrice"]);
    can("update", "Customer", ["title"]);
  });

  const readable = getReadableFields(ability, "Customer", [
    "id",
    "title",
    "costPrice",
    "secretNote",
  ]);
  assert.deepEqual(readable.sort(), ["costPrice", "id", "title"]);

  const editable = getEditableFields(ability, "Customer", [
    "id",
    "title",
    "costPrice",
  ]);
  assert.deepEqual(editable, ["title"]);
});

test("pickReadableFields 过滤对象并剥离隐藏敏感字段", () => {
  const ability = defineAbility((can) => {
    can("read", "Customer", ["id", "title"]);
  });

  const record = {
    id: "po_1",
    title: "办公用品采购",
    costPrice: 99.99,
    internalSecret: "商业机密",
  };

  const masked = pickReadableFields(ability, "Customer", record);
  assert.deepEqual(masked, {
    id: "po_1",
    title: "办公用品采购",
  });
});

test("assertEditableFields 允许合法可编辑字段并拦截只读或隐藏字段变更", () => {
  const ability = defineAbility((can) => {
    can("read", "Customer", ["title", "costPrice"]);
    can("update", "Customer", ["title"]);
  });

  // 合法更新：仅包含可编辑字段
  assert.doesNotThrow(() => {
    assertEditableFields(ability, "Customer", {
      title: "更新后的采购订单",
    });
  });

  // 越权拦截：试图修改 READONLY 字段 costPrice，触发 ForbiddenError 拒绝
  assert.throws(
    () => {
      assertEditableFields(ability, "Customer", {
        costPrice: 50.0,
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ForbiddenError);
      assert.match(
        (err as Error).message,
        /禁止修改 Customer 的非编辑或隐藏字段: costPrice/,
      );
      return true;
    },
  );

  // 越权拦截：试图修改 HIDDEN 字段 secretNote，触发 ForbiddenError 拒绝
  assert.throws(
    () => {
      assertEditableFields(ability, "Customer", {
        secretNote: "恶意注入",
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ForbiddenError);
      assert.match(
        (err as Error).message,
        /禁止修改 Customer 的非编辑或隐藏字段: secretNote/,
      );
      return true;
    },
  );
});
