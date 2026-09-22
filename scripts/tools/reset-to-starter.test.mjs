import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeStarterResetPlan,
  PRESERVED_DOMAINS,
  PRESERVED_DOMAIN_ROUTES,
} from "./reset-to-starter.mjs";

test("analyzeStarterResetPlan: 正确保留数据字典并识别业务切片", () => {
  const plan = analyzeStarterResetPlan();

  // 1. 数据字典必须被识别为保留项
  assert.ok(plan.domainsToKeep.includes("base-archives"));
  assert.ok(plan.routesToKeep.includes("archives"));

  // 2. 其它业务包必须被列入待清理清单
  const domainRemoveNames = plan.domainsToRemove.map((d) => d.name);
  assert.ok(domainRemoveNames.includes("customer-center"));
  assert.ok(domainRemoveNames.includes("product-center"));
  assert.ok(domainRemoveNames.includes("production-center"));

  // 3. 其它业务路由必须被列入待清理清单
  const routeRemoveNames = plan.routesToRemove.map((r) => r.name);
  assert.ok(routeRemoveNames.includes("customer"));
  assert.ok(routeRemoveNames.includes("product"));
  assert.ok(routeRemoveNames.includes("production"));
});

test("PRESERVED 常量定义正确", () => {
  assert.equal(PRESERVED_DOMAINS.has("base-archives"), true);
  assert.equal(PRESERVED_DOMAIN_ROUTES.has("archives"), true);
  assert.equal(PRESERVED_DOMAINS.has("customer-center"), false);
});
