import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { z } from "zod";
import {
  CrudFormModal,
  createColumnsFromSchema,
  FormFields,
  type FormFieldSchema,
} from "../../index";

// 1. 真实 Zod 校验 Schema
const customerFormSchema = z.object({
  customerName: z.string().min(2, "客户名称至少2个字符"),
  contactPhone: z.string().regex(/^1[3-9]\d{9}$/, "手机号码格式不正确"),
  creditLimit: z.number().min(0, "授信额度不能为负数").describe("授信额度"),
});

const formFields: FormFieldSchema[] = [
  {
    name: "customerName",
    label: "客户全称",
    type: "text",
    required: true,
    placeholder: "请输入客户工商全称",
  },
  {
    name: "contactPhone",
    label: "联系电话",
    type: "text",
    required: true,
    placeholder: "请输入11位手机号",
  },
  {
    name: "creditLimit",
    label: "授信额度",
    type: "number",
    placeholder: "0",
  },
];

test("Zod Schema: safeParse 严格拦截不合法数据并产生准确错误信息", () => {
  const invalidData = {
    customerName: "A", // 小于 2 字符
    contactPhone: "123456", // 非合规手机号
    creditLimit: -100, // 负数
  };

  const parseResult = customerFormSchema.safeParse(invalidData);
  assert.equal(parseResult.success, false);

  if (!parseResult.success) {
    const errorMap: Record<string, string> = {};
    for (const issue of parseResult.error.issues) {
      errorMap[String(issue.path[0])] = issue.message;
    }

    assert.equal(errorMap.customerName, "客户名称至少2个字符");
    assert.equal(errorMap.contactPhone, "手机号码格式不正确");
    assert.equal(errorMap.creditLimit, "授信额度不能为负数");
  }

  // 合法数据校验通过
  const validData = {
    customerName: "示例零售旗舰店",
    contactPhone: "13812345678",
    creditLimit: 50000,
  };
  const validResult = customerFormSchema.safeParse(validData);
  assert.equal(validResult.success, true);
});

test("CrudFormModal: create 模式渲染提交按钮与字段，支持 Zod Schema 驱动", () => {
  const html = renderToString(
    <CrudFormModal
      open={true}
      inline={true}
      mode="create"
      title="新增客户"
      schema={customerFormSchema}
      fields={formFields}
      initialValues={{
        customerName: "",
        contactPhone: "",
        creditLimit: 0,
      }}
      onClose={() => {}}
      onSubmit={async () => {}}
    />,
  );

  // 必须渲染标题与主操作按钮
  assert.match(html, /新增客户/);
  assert.match(html, /立即创建/);
  assert.match(html, /客户全称/);
  assert.match(html, /联系电话/);
  assert.match(html, /授信额度/);
});

test("CrudFormModal: edit 模式渲染保存修改按钮", () => {
  const html = renderToString(
    <CrudFormModal
      open={true}
      inline={true}
      mode="edit"
      title="编辑客户"
      schema={customerFormSchema}
      fields={formFields}
      initialValues={{
        customerName: "杭州生鲜中心",
        contactPhone: "13900000000",
        creditLimit: 100000,
      }}
      onClose={() => {}}
      onSubmit={async () => {}}
    />,
  );

  assert.match(html, /编辑客户/);
  assert.match(html, /保存修改/);
});

test("CrudFormModal: view 模式下全部字段置灰只读且隐藏提交按钮", () => {
  const html = renderToString(
    <CrudFormModal
      open={true}
      inline={true}
      mode="view"
      title="查看客户详情"
      schema={customerFormSchema}
      fields={formFields}
      initialValues={{
        customerName: "杭州生鲜中心",
        contactPhone: "13900000000",
        creditLimit: 100000,
      }}
      onClose={() => {}}
      onSubmit={async () => {}}
    />,
  );

  assert.match(html, /查看客户详情/);
  // view 模式下底栏仅展示「关闭」，绝不渲染「立即创建」或「保存修改」
  assert.match(html, /关闭/);
  assert.doesNotMatch(html, /立即创建/);
  assert.doesNotMatch(html, /保存修改/);

  // 输入框必须全部带有 disabled 属性
  assert.match(html, /disabled/);
});

test("FormFields: 当传入错误信息时，渲染红字 form-message 且设置 aria-invalid", () => {
  const html = renderToString(
    <FormFields
      fields={formFields}
      values={{ customerName: "A", contactPhone: "123", creditLimit: 0 }}
      errors={{
        customerName: "客户名称至少2个字符",
        contactPhone: "手机号码格式不正确",
      }}
      onChange={() => {}}
    />,
  );

  // 验证渲染了红字提示与 aria-invalid
  assert.match(html, /data-slot="form-message"/);
  assert.match(html, /客户名称至少2个字符/);
  assert.match(html, /手机号码格式不正确/);
  assert.match(html, /aria-invalid="true"/);
});

test("createColumnsFromSchema: 根据 Zod Schema 自动派生 Table 列契约", () => {
  interface CustomerRow {
    customerName: string;
    contactPhone: string;
    creditLimit: number;
    status: string;
  }

  const entitySchema = z.object({
    customerName: z.string().describe("客户全称"),
    contactPhone: z.string().describe("联系方式"),
    creditLimit: z.number().describe("授信总额"),
    status: z.string().describe("账户状态"),
  });

  const columns = createColumnsFromSchema<CustomerRow>(entitySchema, {
    overrides: {
      creditLimit: {
        format: (val) => `¥${Number(val).toLocaleString()}`,
      },
      status: {
        cell: (val) => `[${val}]`,
      },
    },
    extraColumns: [
      {
        id: "actions",
        header: "操作列",
        cell: () => "操作按钮",
      },
    ],
  });

  assert.equal(columns.length, 5); // 4 实体字段 + 1 extra
  assert.equal(columns[0].id, "customerName");
  assert.equal(columns[0].header, "客户全称");
  assert.equal(columns[0].align, "left");

  // 数值列自动右对齐
  assert.equal(columns[2].id, "creditLimit");
  assert.equal(columns[2].header, "授信总额");
  assert.equal(columns[2].align, "right");

  // 格式化输出测试
  const mockRow: CustomerRow = {
    customerName: "示例企业集团",
    contactPhone: "13800000000",
    creditLimit: 125000,
    status: "ACTIVE",
  };

  assert.equal(columns[2].cell(mockRow, 0), "¥125,000");
  assert.equal(columns[3].cell(mockRow, 0), "[ACTIVE]");
  assert.equal(columns[4].header, "操作列");
});
