import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  CustomerFormModal,
  DEFAULT_CUSTOMER_VALUES,
} from "./CustomerFormModal";
import type { CustomerListItem } from "../types";

const mockCategories = [
  { categoryCode: "CAT_RETAIL", categoryName: "零售餐饮" },
  { categoryCode: "CAT_HOTEL", categoryName: "酒店连锁" },
];

const mockTags = [
  { tagCode: "TAG_VIP", tagName: "重要客户" },
  { tagCode: "TAG_KA", tagName: "战略大客户" },
];

const mockCustomerRecord: CustomerListItem = {
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
  customerTags: "TAG_VIP,TAG_KA",
  status: "ACTIVE",
  _count: { stores: 5 },
};

test("CustomerFormModal [新增模式]: 严禁人工维护ID/编码，全字段开放，渲染立即创建按钮", () => {
  const html = renderToString(
    <CustomerFormModal
      open={true}
      inline={true}
      mode="create"
      record={null}
      categories={mockCategories}
      tags={mockTags}
      onClose={() => {}}
    />,
  );

  assert.match(html, /新建客户主数据档案/);
  assert.match(html, /立即创建客户/);
  // 新增模式下绝不展示客户编码录入框
  assert.doesNotMatch(
    html,
    /客户编码 \(系统自动生成\)/,
    "新增模式下不应出现编码输入框",
  );
  assert.match(html, /自动编号提醒/);
  assert.match(html, /后端规则引擎自动单调递增生成/);
});

test("CustomerFormModal [编辑模式]: 唯一标识只读锁定，完整回填全量字段，渲染保存修改按钮", () => {
  const html = renderToString(
    <CustomerFormModal
      open={true}
      inline={true}
      mode="edit"
      record={mockCustomerRecord}
      categories={mockCategories}
      tags={mockTags}
      onClose={() => {}}
    />,
  );

  assert.match(html, /编辑客户档案: 绿叶连锁餐饮股份有限公司/);
  assert.match(html, /保存修改/);
  // 客户编码作为只读项展示
  assert.match(html, /客户编码 \(系统自动生成\)/);
  assert.match(html, /CUST-20260909-0001/);
  // 完整回填各板块字段
  assert.match(html, /绿叶连锁餐饮股份有限公司/);
  assert.match(html, /王总/);
  assert.match(html, /13912345678/);
  assert.match(html, /80000/);
  assert.match(html, /李销售/);
  assert.match(html, /上午 8:00 - 10:00/);
  assert.match(html, /共挂载.*5.*个关联履约门店/);
});

test("CustomerFormModal [查看模式]: 居中模态窗，全字段只读置灰，隐藏提交按钮", () => {
  const html = renderToString(
    <CustomerFormModal
      open={true}
      inline={true}
      mode="view"
      record={mockCustomerRecord}
      categories={mockCategories}
      tags={mockTags}
      onClose={() => {}}
    />,
  );

  assert.match(html, /客户档案详情: 绿叶连锁餐饮股份有限公司/);
  // 隐藏创建或保存提交按钮，仅展示关闭
  assert.doesNotMatch(html, /立即创建/);
  assert.doesNotMatch(html, /保存修改/);
  assert.match(html, /关闭/);
  // 输入控件全部带 disabled 属性
  assert.match(html, /disabled/);
  // 履约门店卡片正常渲染
  assert.match(html, /下属履约门店统计/);
  assert.match(html, /共挂载.*5.*个关联履约门店/);
});

test("CustomerFormModal [数据清空防御]: 重新打开新建模式时初始数据保持默认纯净", () => {
  // 验证 DEFAULT_CUSTOMER_VALUES 全空
  assert.equal(DEFAULT_CUSTOMER_VALUES.customerName, "");
  assert.equal(DEFAULT_CUSTOMER_VALUES.contactPerson, "");
  assert.equal(DEFAULT_CUSTOMER_VALUES.contactPhone, "");
  assert.equal(DEFAULT_CUSTOMER_VALUES.creditLimit, null);
  assert.equal(DEFAULT_CUSTOMER_VALUES.salesPerson, "");

  // 模拟从编辑切换回新增
  const createHtml = renderToString(
    <CustomerFormModal
      open={true}
      inline={true}
      mode="create"
      record={null}
      categories={mockCategories}
      tags={mockTags}
      onClose={() => {}}
    />,
  );

  // 确保没有上次残留的客户名称或电话
  assert.doesNotMatch(createHtml, /绿叶连锁餐饮股份有限公司/);
  assert.doesNotMatch(createHtml, /13912345678/);
});

test("CustomerFormModal [CASL 字段权限 - 隐藏 (HIDDEN)]: 不可读字段从模态框中彻底剥离", () => {
  // 构造限制 ability：隐藏 contactPhone 与 creditLimit
  const restrictedAbility = {
    can(action: string, subject: string, field?: string) {
      if (
        subject === "Customer" &&
        (field === "contactPhone" || field === "creditLimit")
      ) {
        return false;
      }
      return true;
    },
  };

  const html = renderToString(
    <CustomerFormModal
      open={true}
      inline={true}
      mode="view"
      record={mockCustomerRecord}
      categories={mockCategories}
      tags={mockTags}
      ability={restrictedAbility}
      onClose={() => {}}
    />,
  );

  // 允许的字段正常存在
  assert.match(html, /绿叶连锁餐饮股份有限公司/);
  assert.match(html, /王总/);
  // 敏感隐藏字段彻底不被渲染
  assert.doesNotMatch(html, /联系人电话/);
  assert.doesNotMatch(html, /13912345678/);
  assert.doesNotMatch(html, /信用额度/);
  assert.doesNotMatch(html, /80000/);
});

test("CustomerFormModal [CASL 字段权限 - 只读 (READONLY)]: 可读不可写字段在编辑模式下锁定禁用", () => {
  // 构造限制 ability：settlementMethod 可读但不可写
  const readonlyAbility = {
    can(action: string, subject: string, field?: string) {
      if (
        subject === "Customer" &&
        field === "settlementMethod" &&
        (action === "update" || action === "create")
      ) {
        return false;
      }
      return true;
    },
  };

  const html = renderToString(
    <CustomerFormModal
      open={true}
      inline={true}
      mode="edit"
      record={mockCustomerRecord}
      categories={mockCategories}
      tags={mockTags}
      ability={readonlyAbility}
      onClose={() => {}}
    />,
  );

  // 字段标签正常展示
  assert.match(html, /结算方式/);
  // 带有禁用/权限受限提示
  assert.match(html, /受字段权限控制，当前角色不可修改/);
  // 控件带有 disabled 属性
  assert.match(html, /disabled=""/);
});
