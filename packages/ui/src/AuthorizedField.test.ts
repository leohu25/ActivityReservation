import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  AuthorizedField,
  deriveFieldMode,
  type AbilityLike,
} from "./components/composite/auth/AuthField";

test("deriveFieldMode 遵循设计方案规则正确推导三态", () => {
  const readOnlyAbility: AbilityLike = {
    can(action: string, subject: string, field?: string) {
      if (subject === "PurchaseOrder" && field === "costPrice") {
        return action === "read";
      }
      return false;
    },
  };

  const editableAbility: AbilityLike = {
    can(action: string, subject: string, field?: string) {
      if (subject === "PurchaseOrder" && field === "costPrice") {
        return action === "read" || action === "update";
      }
      return false;
    },
  };

  const hiddenAbility: AbilityLike = {
    can() {
      return false;
    },
  };

  assert.equal(
    deriveFieldMode(readOnlyAbility, "PurchaseOrder", "costPrice", "update"),
    "READONLY",
  );
  assert.equal(
    deriveFieldMode(editableAbility, "PurchaseOrder", "costPrice", "update"),
    "EDITABLE",
  );
  assert.equal(
    deriveFieldMode(hiddenAbility, "PurchaseOrder", "costPrice", "update"),
    "HIDDEN",
  );
  // Fail-Closed: 缺失 ability 时默认隐藏
  assert.equal(
    deriveFieldMode(undefined, "PurchaseOrder", "costPrice", "update"),
    "HIDDEN",
  );
  // 显式 mode 覆盖优先
  assert.equal(
    deriveFieldMode(
      undefined,
      "PurchaseOrder",
      "costPrice",
      "update",
      "EDITABLE",
    ),
    "EDITABLE",
  );
});

test("AuthorizedField 在只读权限下自动推导 READONLY 并渲染只读标识与禁用属性", () => {
  const readOnlyAbility: AbilityLike = {
    can(action: string, subject: string, field?: string) {
      return (
        action === "read" &&
        subject === "PurchaseOrder" &&
        field === "costPrice"
      );
    },
  };

  const input = React.createElement("input", {
    type: "text",
    defaultValue: "¥ 8,888.00",
  });

  const html = renderToString(
    React.createElement(AuthorizedField, {
      ability: readOnlyAbility,
      subject: "PurchaseOrder",
      field: "costPrice",
      action: "update",
      label: "采购成本价",
      children: input,
    }),
  );

  assert.match(html, /采购成本价/);
  assert.match(html, /只读/);
  assert.match(html, /disabled/);
  assert.match(html, /readOnly/i);
  assert.match(html, /¥ 8,888\.00/);
});

test("AuthorizedField 在无读权限下自动推导 HIDDEN 并彻底不渲染子控件", () => {
  const noReadAbility: AbilityLike = {
    can() {
      return false;
    },
  };

  const input = React.createElement("input", {
    type: "text",
    defaultValue: "机密利润",
  });

  const hiddenHtml = renderToString(
    React.createElement(AuthorizedField, {
      ability: noReadAbility,
      subject: "PurchaseOrder",
      field: "profit",
      label: "利润金额",
      fallback: React.createElement("span", null, "保密字段"),
      children: input,
    }),
  );

  assert.match(hiddenHtml, /保密字段/);
  assert.doesNotMatch(hiddenHtml, /机密利润/);
  assert.doesNotMatch(hiddenHtml, /input/);
});

test("AuthorizedField 在具有读写权限时自动推导 EDITABLE 正常交互渲染", () => {
  const fullAbility: AbilityLike = {
    can() {
      return true;
    },
  };

  const input = React.createElement("input", {
    type: "text",
    defaultValue: "测试供应商",
  });

  const html = renderToString(
    React.createElement(AuthorizedField, {
      ability: fullAbility,
      subject: "PurchaseOrder",
      field: "supplierName",
      action: "update",
      label: "供应商名称",
      children: input,
    }),
  );

  assert.match(html, /供应商名称/);
  assert.match(html, /测试供应商/);
  assert.doesNotMatch(html, /只读/);
  assert.doesNotMatch(html, /disabled/);
});
