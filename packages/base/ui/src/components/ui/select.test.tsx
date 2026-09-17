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

test("Select 能够从 SelectItem children 自动提取中文 label 回显，而非暴露原始枚举编码", () => {
  const html = renderToString(
    React.createElement(
      Select,
      { value: "MONTHLY" },
      React.createElement(
        SelectTrigger,
        null,
        React.createElement(SelectValue, { placeholder: "请选择结算方式" }),
      ),
      React.createElement(
        SelectContent,
        null,
        React.createElement(
          SelectGroup,
          null,
          React.createElement(
            SelectItem,
            { value: "MONTHLY" },
            "月结 (MONTHLY)",
          ),
          React.createElement(SelectItem, { value: "CASH" }, "现结 (CASH)"),
          React.createElement(
            SelectItem,
            { value: "PREPAID" },
            "预付 (PREPAID)",
          ),
        ),
      ),
    ),
  );

  // 验证回显内容是中文 label 而非原始英文枚举编码
  assert.ok(html.includes("月结 (MONTHLY)"));
});

test("Select 能够正确处理 filterExtra 等过滤栏下的 ALL 选项回显为'全部'", () => {
  const html = renderToString(
    React.createElement(
      Select,
      { value: "ALL" },
      React.createElement(
        SelectTrigger,
        null,
        React.createElement(SelectValue, { placeholder: "全部" }),
      ),
      React.createElement(
        SelectContent,
        null,
        React.createElement(
          SelectGroup,
          null,
          React.createElement(SelectItem, { value: "ALL" }, "全部"),
          React.createElement(SelectItem, { value: "CAT_1" }, "餐饮连锁"),
        ),
      ),
    ),
  );

  // 验证回显内容为 '全部'，不暴露 'ALL'
  assert.ok(
    html.includes(
      '<span data-slot="select-value" class="flex flex-1 text-left">全部</span>',
    ),
  );
});

test("Select 未选择值时正常展示 placeholder", () => {
  const html = renderToString(
    React.createElement(
      Select,
      { value: null },
      React.createElement(
        SelectTrigger,
        null,
        React.createElement(SelectValue, { placeholder: "请选择客户分类" }),
      ),
      React.createElement(
        SelectContent,
        null,
        React.createElement(SelectItem, { value: "A" }, "分类A"),
      ),
    ),
  );

  assert.ok(html.includes("请选择客户分类"));
});
