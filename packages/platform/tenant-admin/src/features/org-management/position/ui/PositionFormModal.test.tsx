import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { UiAbilityProvider } from "@base/ui";
import { PositionFormModal } from "./PositionFormModal";
import type { PositionItem } from "../types";

const mockPosition: PositionItem = {
  id: "pos-001",
  name: "供应链总监",
  code: "pos_supply_director",
  description: "全面统筹供应链与仓配网络",
  sort: 1,
  status: "ACTIVE",
  employeeCount: 5,
  createdAt: new Date(),
};

test("PositionFormModal [新增模式]: 渲染新建岗位标题与提交按钮", () => {
  const html = renderToString(
    <PositionFormModal
      open={true}
      inline={true}
      mode="create"
      record={null}
      onClose={() => {}}
    />,
  );

  assert.match(html, /新建岗位字典/);
  assert.match(html, /立即创建岗位/);
  assert.match(html, /岗位名称/);
  assert.match(html, /岗位编码/);
});

test("PositionFormModal [编辑模式]: 回填既有岗位数据并锁定编码", () => {
  const html = renderToString(
    <PositionFormModal
      open={true}
      inline={true}
      mode="edit"
      record={mockPosition}
      onClose={() => {}}
    />,
  );

  assert.match(html, /编辑岗位: 供应链总监/);
  assert.match(html, /供应链总监/);
  assert.match(html, /pos_supply_director/);
  assert.match(html, /保存修改/);
});

test("PositionFormModal [CASL 权限感知]: 隐藏敏感字段时不予渲染", () => {
  const restrictedAbility = {
    can(_action: string, subject: string, field?: string) {
      if (subject === "Position" && field === "description") {
        return false;
      }
      return true;
    },
  };

  const html = renderToString(
    <UiAbilityProvider ability={restrictedAbility}>
      <PositionFormModal
        open={true}
        inline={true}
        mode="create"
        record={null}
        onClose={() => {}}
      />
    </UiAbilityProvider>,
  );

  assert.match(html, /岗位名称/);
  assert.doesNotMatch(html, /职责说明/);
});
