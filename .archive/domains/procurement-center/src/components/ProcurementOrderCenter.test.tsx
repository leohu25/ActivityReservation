import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  TenantAbilityProvider,
  createAbilityFromSnapshot,
} from "@base/authorization";
import { UiAbilityProvider } from "@base/ui";
import {
  ProcurementOrderStatus,
  procurementOrderPageContract,
} from "../contracts";
import type { ProcurementOrderItem } from "../types";
import { ProcurementOrderCenter } from "./ProcurementOrderCenter";

const order: ProcurementOrderItem = {
  id: "po_hidden_fields",
  orderNo: "PO-SECRET-001",
  supplierName: "机密供应商",
  quantity: 10,
  costPrice: "¥5,000.00",
  deptId: "dept_root",
  departmentName: "采购部",
  createdById: "user_creator",
  status: ProcurementOrderStatus.PENDING,
  auditComment: "内部审核意见",
  createdAt: new Date("2026-09-09T00:00:00.000Z"),
  updatedAt: new Date("2026-09-09T00:00:00.000Z"),
  canAuditThisOrder: false,
  isSelfAuditBlocked: false,
};

function renderCenter(
  ui: React.ReactElement,
  permissions?: {
    actions: readonly string[];
    fieldPolicies?: Readonly<Record<string, string>>;
  },
) {
  if (!permissions) {
    return renderToString(ui);
  }
  const snapshots = {
    subject: procurementOrderPageContract.subject,
    actions: permissions.actions,
    fieldPolicies: permissions.fieldPolicies,
  };
  const ability = createAbilityFromSnapshot(snapshots);
  return renderToString(
    <TenantAbilityProvider snapshots={snapshots}>
      <UiAbilityProvider ability={ability}>{ui}</UiAbilityProvider>
    </TenantAbilityProvider>,
  );
}

test("ProcurementOrderCenter 依据 fieldVisibility 对 HIDDEN 字段直接移除整列且不渲染掩码", () => {
  const snapshots = {
    subject: procurementOrderPageContract.subject,
    actions: ["read"],
    fieldPolicies: {},
  };
  const ability = createAbilityFromSnapshot(snapshots);
  const html = renderToString(
    <TenantAbilityProvider snapshots={snapshots}>
      <UiAbilityProvider ability={ability}>
        <ProcurementOrderCenter
          orders={[order]}
          sqlWhere={{ deptId: "dept_root" }}
          activeOrgId="org_test"
          departmentName="采购部"
          canCreate={false}
          canExport={false}
          fieldVisibility={{
            orderNo: false,
            supplierName: false,
            quantity: true,
            costPrice: false,
            status: true,
            auditComment: false,
          }}
          currentUserId="user_viewer"
        />
      </UiAbilityProvider>
    </TenantAbilityProvider>,
  );

  assert.doesNotMatch(html, /订单编号/);
  assert.doesNotMatch(html, /供应商名称/);
  assert.doesNotMatch(html, /采购单价/);
  assert.doesNotMatch(html, /审核意见/);
  assert.doesNotMatch(
    html,
    /PO-SECRET-001|机密供应商|5,000|内部审核意见|\*\*\*/,
  );
  assert.match(html, /采购数量/);
  assert.match(html, /10<!-- -->.*件/);
  assert.match(html, /状态/);
  assert.match(html, /待审核/);
});

test("ProcurementOrderCenter 严格根据 AbilityProvider fieldPolicies 动态执行 HIDDEN 物理列剥离", () => {
  const htmlWithHidden = renderCenter(
    <ProcurementOrderCenter orders={[order]} />,
    {
      actions: ["read"],
      fieldPolicies: {
        costPrice: "HIDDEN",
        supplierName: "HIDDEN",
      },
    },
  );

  assert.doesNotMatch(
    htmlWithHidden,
    /<th[^>]*>采购单价/,
    "HIDDEN 采购单价列头必须被剔除",
  );
  assert.doesNotMatch(
    htmlWithHidden,
    /5,000\.00/,
    "HIDDEN 采购单价值必须被剔除",
  );
  assert.doesNotMatch(
    htmlWithHidden,
    /<th[^>]*>供应商名称/,
    "HIDDEN 供应商名称列头必须被剔除",
  );
  assert.doesNotMatch(
    htmlWithHidden,
    /机密供应商/,
    "HIDDEN 供应商名称值必须被剔除",
  );
  assert.match(htmlWithHidden, /订单编号/, "非 HIDDEN 字段应正常展示");

  const htmlFull = renderCenter(<ProcurementOrderCenter orders={[order]} />, {
    actions: ["read"],
    fieldPolicies: {},
  });

  assert.match(htmlFull, /采购单价/);
  assert.match(htmlFull, /供应商名称/);
});

test("ProcurementOrderCenter 依据 export 权限动态控制【导出数据】按钮显隐", () => {
  const withExport = renderCenter(<ProcurementOrderCenter orders={[order]} />, {
    actions: ["read", "export"],
  });
  assert.match(withExport, /导出数据/, "具有 export 权限时应渲染导出按钮");

  const withoutExport = renderCenter(
    <ProcurementOrderCenter orders={[order]} />,
    { actions: ["read"] },
  );
  assert.doesNotMatch(
    withoutExport,
    /导出数据/,
    "无 export 权限时绝不渲染导出按钮",
  );
});

test("ProcurementOrderCenter 契约自包含检验：subject 与 resource 正确", () => {
  assert.equal(procurementOrderPageContract.subject, "PurchaseOrder");
  assert.ok(procurementOrderPageContract.actions.length > 0);
  assert.ok(procurementOrderPageContract.configurableFields?.length);
});

test("ProcurementOrderCenter 正常渲染搜索栏与状态选项", () => {
  const html = renderCenter(<ProcurementOrderCenter orders={[order]} />, {
    actions: ["read"],
  });
  assert.match(html, /采购单号、供应商/);
  assert.match(html, /全部状态/);
  assert.match(html, /刷新/);
});
