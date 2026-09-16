import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { StoreFormModal } from "./StoreFormModal";
import type { StoreListItem } from "../types";
import type { CustomerListItem } from "../../customer-management/types";

const mockCustomers: CustomerListItem[] = [
  {
    id: "cust-001",
    customerCode: "CUST-20260909-0001",
    customerName: "绿叶连锁餐饮股份有限公司",
    categoryCode: "CAT_RETAIL",
    contactPerson: "王总",
    contactPhone: "13912345678",
    settlementMethod: "MONTHLY",
    defaultTaxRate: 9,
    creditLimit: 80000,
    salesPerson: "李销售",
    serviceTime: "上午 8:00 - 10:00",
    customerTags: "TAG_VIP",
    status: "ACTIVE",
    _count: { stores: 5 },
  },
];

const mockStoreRecord: StoreListItem = {
  id: "stor-001",
  storeCode: "STOR-20260909-0001",
  storeName: "绿叶餐饮(西湖银泰店)",
  customerCode: "CUST-20260909-0001",
  customer: {
    customerName: "绿叶连锁餐饮股份有限公司",
    customerCode: "CUST-20260909-0001",
    status: "ACTIVE",
  },
  regionCode: "REGION_HD_01",
  address: "杭州市上城区延安路98号B1层",
  contactPerson: "李厨师长",
  contactPhone: "13912345678",
  deliveryPeriod: "MORNING",
  defaultRoute: "ROUTE_01",
  defaultDriver: "张师傅",
  billingContact: "财务小张",
  billingPhone: "13800001111",
  status: "ACTIVE",
};

test("StoreFormModal [新增模式]: 隐藏单据编码，全字段开放，渲染创建门店按钮与编号提醒", () => {
  const html = renderToString(
    <StoreFormModal
      open={true}
      inline={true}
      mode="create"
      record={null}
      customers={mockCustomers}
      onClose={() => {}}
    />,
  );

  assert.ok(html.includes("新建履约门店档案"));
  assert.ok(html.includes("立即创建门店"));
  assert.ok(html.includes("自动编号提醒"));
  assert.ok(!html.includes("系统自动分配（唯一标识）"));
});

test("StoreFormModal [编辑模式]: 回填已有门店数据，锁定门店编码与所属客户企业", () => {
  const html = renderToString(
    <StoreFormModal
      open={true}
      inline={true}
      mode="edit"
      record={mockStoreRecord}
      customers={mockCustomers}
      onClose={() => {}}
    />,
  );

  assert.ok(html.includes("编辑门店档案"));
  assert.ok(html.includes("STOR-20260909-0001"));
  assert.ok(html.includes("绿叶餐饮(西湖银泰店)"));
  assert.ok(html.includes("保存修改"));
});

test("StoreFormModal [查看模式]: 只读详情居中展示，隐藏提交保存按钮", () => {
  const html = renderToString(
    <StoreFormModal
      open={true}
      inline={true}
      mode="view"
      record={mockStoreRecord}
      customers={mockCustomers}
      onClose={() => {}}
    />,
  );

  assert.ok(html.includes("门店档案详情"));
  assert.ok(html.includes("STOR-20260909-0001"));
  assert.ok(html.includes("李厨师长"));
  assert.ok(html.includes("所属客户信息"));
  assert.ok(!html.includes("保存修改"));
  assert.ok(!html.includes("立即创建门店"));
});
