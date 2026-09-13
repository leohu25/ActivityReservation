import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { FormDrawer, FormSection, FormFieldGrid, FormFields } from "./index";

test("FormDrawer: 正常渲染抽屉结构", () => {
  const html = renderToString(
    <FormDrawer
      open={true}
      inline={true}
      onOpenChange={() => {}}
      title="测试侧滑抽屉"
      description="用于测试的表单描述"
    >
      <FormSection title="基础信息">
        <FormFieldGrid columns={2}>
          <div data-testid="field-1">字段1</div>
          <div data-testid="field-2">字段2</div>
        </FormFieldGrid>
      </FormSection>
    </FormDrawer>,
  );

  assert.match(html, /测试侧滑抽屉/);
  assert.match(html, /基础信息/);
  assert.match(html, /字段1/);
});

test("FormFields: 正确根据 Schema 渲染不同类型的字段", () => {
  const fields = [
    {
      name: "textInput",
      label: "文本框",
      type: "text" as const,
      placeholder: "请输入文本",
    },
    {
      name: "selectInput",
      label: "下拉框",
      type: "select" as const,
      options: [{ value: "opt1", label: "选项1" }],
    },
    { name: "switchInput", label: "开关项", type: "switch" as const },
    { name: "checkboxInput", label: "复选框", type: "checkbox" as const },
  ];

  const html = renderToString(
    <FormFields
      fields={fields}
      values={{
        textInput: "测试文本",
        selectInput: "opt1",
        switchInput: true,
        checkboxInput: false,
      }}
      onChange={() => {}}
      columns={2}
    />,
  );

  assert.match(html, /文本框/);
  assert.match(html, /请输入文本/);
  assert.match(html, /测试文本/);
  assert.match(html, /下拉框/);
  assert.match(html, /开关项/);
  assert.match(html, /复选框/);
});

test("FormFields: 正确渲染 radio 字段并支持选项遍历", () => {
  const fields = [
    {
      name: "gender",
      label: "性别选择",
      type: "radio" as const,
      options: [
        { label: "男", value: "M" },
        { label: "女", value: "F" },
      ],
      direction: "row" as const,
    },
  ];

  const html = renderToString(
    <FormFields
      fields={fields}
      values={{ gender: "M" }}
      onChange={() => {}}
      columns={2}
    />,
  );

  assert.match(html, /性别选择/);
  assert.match(html, /男/);
  assert.match(html, /女/);
});
