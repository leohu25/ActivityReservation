import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { PermissionField } from "./index";

test("PermissionField 在 EDITABLE 模式下正常渲染子元素且不注入禁用状态", () => {
  const childInput = React.createElement("input", {
    type: "text",
    defaultValue: "测试供应商",
  });

  const html = renderToString(
    React.createElement(
      PermissionField,
      {
        mode: "EDITABLE",
        label: "供应商名称",
        children: childInput,
      },
    ),
  );

  assert.match(html, /供应商名称/);
  assert.match(html, /value="测试供应商"/);
  assert.doesNotMatch(html, /disabled/);
  assert.doesNotMatch(html, /readOnly/i);
});

test("PermissionField 在 READONLY 模式下注入 disabled 与 readOnly 属性并显示只读标识", () => {
  const childInput = React.createElement("input", {
    type: "text",
    defaultValue: "¥ 999.00",
  });

  const html = renderToString(
    React.createElement(
      PermissionField,
      {
        mode: "READONLY",
        label: "成本价格",
        children: childInput,
      },
    ),
  );

  assert.match(html, /成本价格/);
  assert.match(html, /只读/);
  assert.match(html, /disabled/);
  assert.match(html, /readOnly/i);
});

test("PermissionField 在 HIDDEN 模式下彻底不渲染子元素，仅渲染 fallback 占位", () => {
  const childInput = React.createElement("input", {
    type: "text",
    defaultValue: "机密数据",
  });

  const htmlWithoutFallback = renderToString(
    React.createElement(
      PermissionField,
      {
        mode: "HIDDEN",
        label: "内部机密",
        children: childInput,
      },
    ),
  );

  assert.equal(htmlWithoutFallback, "");

  const htmlWithFallback = renderToString(
    React.createElement(
      PermissionField,
      {
        mode: "HIDDEN",
        label: "内部机密",
        fallback: React.createElement("span", null, "无权查看"),
        children: childInput,
      },
    ),
  );

  assert.match(htmlWithFallback, /无权查看/);
  assert.doesNotMatch(htmlWithFallback, /机密数据/);
});
