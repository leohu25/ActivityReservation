import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import {
  TenantAbilityProvider,
  createAbilityFromSnapshot,
} from "@base/authorization";
import { UiAbilityProvider } from "@base/ui";
import { PositionView } from "./PositionView";
import { positionPageContract } from "../position.contract";
import type { PositionItem } from "../types";

const mockPositions: PositionItem[] = [
  {
    id: "pos-001",
    name: "技术主管",
    code: "pos_tech_lead",
    description: "负责技术架构演进",
    sort: 1,
    status: "ACTIVE",
    employeeCount: 3,
    createdAt: new Date(),
  },
];

function renderPositionView(
  ui: React.ReactElement,
  permissions: {
    actions: readonly string[];
    fieldPolicies?: Readonly<Record<string, string>>;
  },
) {
  const snapshots = {
    subject: positionPageContract.subject,
    actions: permissions.actions,
    fieldPolicies: permissions.fieldPolicies,
  };
  const ability = createAbilityFromSnapshot(snapshots);

  return renderToString(
    <TenantAbilityProvider snapshots={snapshots}>
      <UiAbilityProvider ability={ability}>
        <NuqsTestingAdapter>{ui}</NuqsTestingAdapter>
      </UiAbilityProvider>
    </TenantAbilityProvider>,
  );
}

test("PositionView 正常渲染企业岗位字典工作台", () => {
  const html = renderPositionView(
    <PositionView data={mockPositions} total={1} />,
    { actions: ["read"], fieldPolicies: {} },
  );

  assert.ok(html.includes("企业岗位字典"), "应正常渲染企业岗位字典标题");
  assert.ok(html.includes("技术主管"), "应正常渲染岗位名称");
  assert.ok(html.includes("pos_tech_lead"), "应正常渲染岗位编码");
});

test("PositionView 依据 export 权限动态控制【导出数据】按钮渲染", () => {
  const htmlWithExport = renderPositionView(
    <PositionView data={mockPositions} total={1} />,
    { actions: ["read", "export"], fieldPolicies: {} },
  );
  assert.match(htmlWithExport, /导出/, "拥有 export 权限时应渲染导出按钮");

  const htmlWithoutExport = renderPositionView(
    <PositionView data={mockPositions} total={1} />,
    { actions: ["read"], fieldPolicies: {} },
  );
  assert.doesNotMatch(
    htmlWithoutExport,
    /导出/,
    "无 export 权限时不应渲染导出按钮",
  );
});
