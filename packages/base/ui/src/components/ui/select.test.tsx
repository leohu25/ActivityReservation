import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
} from "./select";

test("Select 原生原子套件服务端能正常渲染 trigger 与 placeholder", () => {
  const html = renderToString(
    React.createElement(
      Select,
      { defaultValue: null },
      React.createElement(
        SelectTrigger,
        null,
        React.createElement(SelectValue, { placeholder: "请选择客户分类" }),
      ),
      React.createElement(
        SelectContent,
        null,
        React.createElement(
          SelectGroup,
          null,
          React.createElement(SelectItem, { value: "A" }, "分类A"),
        ),
      ),
    ),
  );

  assert.ok(html.includes("请选择客户分类"));
});
