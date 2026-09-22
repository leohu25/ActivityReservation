import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { createAbilityFromSnapshot } from "@base/authorization";
import { UiAbilityProvider } from "@base/ui";
import { TenantsView } from "./TenantsView";
import { TenantManagementSubject } from "../contract";
import type { ControlTenantItem } from "../types";

const mockTenants: ControlTenantItem[] = [
  {
    id: "org-1",
    name: "示例示范租户",
    slug: "demo-tenant",
    createdAt: new Date("2026-01-01"),
    memberCount: 12,
    database: {
      databaseName: "tenant_demo_corp",
      clusterCode: "primary",
      schemaVersion: "3",
      status: "ACTIVE",
      updatedAt: new Date(),
    },
    latestMigration: {
      version: "20260101_init",
      migrationName: "init_schema",
      status: "SUCCESS",
      appliedSteps: 5,
    },
  },
];

function renderTenantsView(
  ui: React.ReactElement,
  permissions: {
    actions: readonly string[];
    fieldPolicies?: Readonly<Record<string, string>>;
  },
) {
  const snapshots = {
    subject: TenantManagementSubject,
    actions: permissions.actions,
    fieldPolicies: permissions.fieldPolicies ?? {},
  };
  const ability = createAbilityFromSnapshot(snapshots);

  return renderToString(
    <UiAbilityProvider ability={ability}>
      <NuqsTestingAdapter>{ui}</NuqsTestingAdapter>
    </UiAbilityProvider>,
  );
}

describe("TenantsView", () => {
  it("正确渲染 DataTable 租户列表、物理库名称与成员规模", () => {
    const ability = {
      can(action: string, subject: string, _field?: string) {
        if (subject === TenantManagementSubject && action === "read") return true;
        return false;
      },
    };

    const html = renderToString(
      <UiAbilityProvider ability={ability}>
        <NuqsTestingAdapter>
          <TenantsView data={mockTenants} />
        </NuqsTestingAdapter>
      </UiAbilityProvider>,
    );

    assert.ok(html.includes("租户与独立物理数据库管控清单"), "应渲染页面标题");
    assert.ok(html.includes("示例示范租户"), "应渲染租户全称");
    assert.ok(html.includes("demo-tenant"), "应渲染租户Slug");
    assert.ok(html.includes("tenant_demo_corp"), "应渲染物理数据库名");
    assert.ok(html.includes("12"), "应渲染成员人数");
    assert.ok(html.includes("正常运行 (ACTIVE)"), "应渲染物理库正常运行徽标");
  });

  it("具备 update 权限时渲染启停挂起管控操作", () => {
    const htmlWithUpdate = renderTenantsView(
      <TenantsView data={mockTenants} />,
      { actions: ["read", "update"] },
    );
    assert.match(htmlWithUpdate, /挂起管控/);
  });

  it("权限感知控制新建租户按钮显隐", () => {
    const htmlWithCreate = renderTenantsView(
      <TenantsView data={mockTenants} />,
      { actions: ["read", "create"] },
    );
    assert.match(htmlWithCreate, /开通新租户/);

    const htmlWithoutCreate = renderTenantsView(
      <TenantsView data={mockTenants} />,
      { actions: ["read"] },
    );
    assert.doesNotMatch(htmlWithoutCreate, /开通新租户/);
  });
});
