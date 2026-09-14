import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { z } from "zod";
import {
  FormModal,
  type FormFieldSchema,
  type DetailTableColumn,
} from "../../index";

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

interface OrderItem {
  itemCode: string;
  itemName: string;
  qty: number;
}

const itemColumns: DetailTableColumn<OrderItem>[] = [
  { id: "itemCode", header: "商品编码", renderCell: (row) => row.itemCode },
  { id: "itemName", header: "商品名称", renderCell: (row) => row.itemName },
  { id: "qty", header: "订购数量", renderCell: (row) => String(row.qty) },
];

test("FormModal [create 模式]: 渲染主操作按钮、字段与 Zod Schema 拦截驱动", () => {
  const html = renderToString(
    <FormModal
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

  assert.match(html, /新增客户/);
  assert.match(html, /立即创建/);
  assert.match(html, /客户全称/);
  assert.match(html, /联系电话/);
  assert.match(html, /授信额度/);
});

test("FormModal [edit 模式]: 渲染保存修改按钮与预填字段", () => {
  const html = renderToString(
    <FormModal
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

test("FormModal [view 模式]: 字段置灰且隐藏提交按钮，仅展示关闭", () => {
  const html = renderToString(
    <FormModal
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
  assert.match(html, /关闭/);
  assert.doesNotMatch(html, /立即创建/);
  assert.doesNotMatch(html, /保存修改/);
  assert.match(html, /disabled/);
});

test("FormModal [内置 DetailTable 联动]: view 模式下明细表自动转为只读呈现", () => {
  const mockItems: OrderItem[] = [
    { itemCode: "ITM001", itemName: "优质有机菜心", qty: 20 },
  ];

  const html = renderToString(
    <FormModal
      open={true}
      inline={true}
      mode="view"
      title="查看采购单详情"
      schema={customerFormSchema}
      fields={formFields}
      initialValues={{
        customerName: "好味超市",
        contactPhone: "13800001111",
        creditLimit: 5000,
      }}
      detailConfig={{
        title: "商品明细清单",
        columns: itemColumns,
        onAddRow: () => ({ itemCode: "", itemName: "", qty: 1 }),
        addText: "添加商品明细",
      }}
      initialItems={mockItems}
      onClose={() => {}}
      onSubmit={async () => {}}
    />,
  );

  // 必须渲染明细表标题与品项数据
  assert.match(html, /商品明细清单/);
  assert.match(html, /优质有机菜心/);
  assert.match(html, /ITM001/);

  // view 模式下自动转只读：明细表绝不渲染「添加商品明细」与操作列
  assert.doesNotMatch(html, /添加商品明细/);
  assert.doesNotMatch(html, />操作</);
});

test("FormModal [内置 DetailTable 联动]: create/edit 模式下明细表支持添加与编辑", () => {
  const mockItems: OrderItem[] = [
    { itemCode: "ITM002", itemName: "精品红富士苹果", qty: 50 },
  ];

  const html = renderToString(
    <FormModal
      open={true}
      inline={true}
      mode="create"
      title="新建采购单"
      schema={customerFormSchema}
      fields={formFields}
      initialValues={{
        customerName: "好味超市",
        contactPhone: "13800001111",
        creditLimit: 5000,
      }}
      detailConfig={{
        title: "采购商品明细",
        columns: itemColumns,
        onAddRow: () => ({ itemCode: "", itemName: "", qty: 1 }),
        addText: "添加商品明细",
      }}
      initialItems={mockItems}
      onClose={() => {}}
      onSubmit={async () => {}}
    />,
  );

  assert.match(html, /采购商品明细/);
  assert.match(html, /精品红富士苹果/);
  // 可编辑模式下必须呈现「添加商品明细」与操作列
  assert.match(html, /添加商品明细/);
  assert.match(html, /操作/);
});

test("FormModal: 缺省 initialItems 与 extraActions 时正确渲染并使用稳定默认引用", () => {
  const html = renderToString(
    <FormModal
      open={true}
      inline={true}
      mode="view"
      title="查看客户详情"
      schema={customerFormSchema}
      fields={formFields}
      initialValues={{
        customerName: "企业B",
        contactPhone: "13500000001",
        creditLimit: 500,
      }}
      onClose={() => {}}
    />,
  );
  assert.match(html, /查看客户详情/);
  assert.match(html, /企业B/);
});

test("FormModal [CASL 字段权限闭环]: subject + ability 驱动 HIDDEN 字段剔除与 READONLY 字段禁用", () => {
  const restrictedAbility = {
    can(action: string, subject?: string, field?: string) {
      if (subject === "Customer") {
        // contactPhone 隐藏 (不可读不可写)
        if (field === "contactPhone") return false;
        // creditLimit 只读 (可读不可写)
        if (
          field === "creditLimit" &&
          (action === "create" || action === "update")
        ) {
          return false;
        }
      }
      return true;
    },
  };

  const html = renderToString(
    <FormModal
      open={true}
      inline={true}
      mode="edit"
      subject="Customer"
      ability={restrictedAbility}
      title="编辑客户"
      schema={customerFormSchema}
      fields={formFields}
      initialValues={{
        customerName: "好味超市",
        contactPhone: "13800001111",
        creditLimit: 5000,
      }}
      onClose={() => {}}
      onSubmit={async () => {}}
    />,
  );

  // 1. 正常放行字段
  assert.match(html, /客户全称/);
  assert.match(html, /好味超市/);

  // 2. HIDDEN 字段彻底从 HTML 结构中剥离
  assert.doesNotMatch(html, /联系电话/);
  assert.doesNotMatch(html, /13800001111/);

  // 3. READONLY 字段保留但标记为禁用态
  assert.match(html, /授信额度/);
  assert.match(html, /受字段权限控制，当前角色不可修改/);
});

test("FormModal [必填与隐藏动态协调]: 被 HIDDEN 隐藏的必填字段自动豁免 Zod 校验错误", () => {
  // contactPhone 为必填项，但权限将其彻底隐藏
  const hiddenRequiredAbility = {
    can(_action: string, subject?: string, field?: string) {
      if (subject === "Customer" && field === "contactPhone") {
        return false;
      }
      return true;
    },
  };

  // 渲染并验证渲染中不含该必填项
  const html = renderToString(
    <FormModal
      open={true}
      inline={true}
      mode="create"
      subject="Customer"
      ability={hiddenRequiredAbility}
      title="新建客户"
      schema={customerFormSchema}
      fields={formFields}
      initialValues={{
        customerName: "好味超市",
        contactPhone: "", // 虽未填且为必填，但由于被权限隐藏，不应阻断
        creditLimit: 5000,
      }}
      onClose={() => {}}
      onSubmit={async () => {}}
    />,
  );

  assert.match(html, /客户全称/);
  assert.doesNotMatch(html, /联系电话/);
});
