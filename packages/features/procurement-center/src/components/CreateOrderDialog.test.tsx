import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  CreateOrderDialog,
  createOrderZodSchema,
} from "./CreateOrderDialog";

test("CreateOrderDialog: 渲染新建按钮与 FormModal 创建表单", () => {
  const html = renderToString(
    <CreateOrderDialog
      open={true}
      inline={true}
      departmentName="华东采购中心"
      onCreated={() => {}}
    />,
  );

  assert.match(html, /新建采购订单/);
  assert.match(html, /供应商名称/);
  assert.match(html, /采购数量/);
  assert.match(html, /采购成本价 \(敏感资产\)/);
  assert.match(html, /华东采购中心/);
  assert.match(html, /确认提交/);
});

test("CreateOrderDialog: 当 fieldModes 设置 HIDDEN 时物理剔除对应字段", () => {
  const html = renderToString(
    <CreateOrderDialog
      open={true}
      inline={true}
      fieldModes={{
        costPrice: "HIDDEN",
      }}
    />,
  );

  assert.match(html, /供应商名称/);
  assert.match(html, /采购数量/);
  assert.doesNotMatch(html, /采购成本价 \(敏感资产\)/);
});

test("createOrderZodSchema: 验证必填字段、数量必须为正整数、单价必须非负", () => {
  const emptyRes = createOrderZodSchema.safeParse({
    supplierName: "",
    quantity: 0,
    costPrice: -1,
  });
  assert.strictEqual(emptyRes.success, false);

  const validRes = createOrderZodSchema.safeParse({
    supplierName: "晨润精密材料",
    quantity: 10,
    costPrice: 500.5,
  });
  assert.strictEqual(validRes.success, true);
});
