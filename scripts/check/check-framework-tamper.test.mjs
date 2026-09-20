import test from "node:test";
import assert from "node:assert/strict";
import {
  isFrameworkFile,
  checkFrameworkTamper,
} from "./check-framework-tamper.mjs";

test("isFrameworkFile: 精准判定框架层基础设施与纯业务切片", () => {
  // 1. 业务切片文件 (domains/*) -> 必须判定为 false (纯业务，不拦截)
  assert.equal(
    isFrameworkFile("packages/domains/customer-center/src/features/customer-management/service.ts"),
    false,
  );
  assert.equal(
    isFrameworkFile("packages/domains/customer-center/src/features/customer-management/ui/CustomerView.tsx"),
    false,
  );

  // 2. 平台底层基建 (base/*) -> 判定为 true (框架核心)
  assert.equal(isFrameworkFile("packages/base/auth/src/index.ts"), true);
  assert.equal(isFrameworkFile("packages/base/db-tenant/prisma/schema.prisma"), true);
  assert.equal(isFrameworkFile("packages/base/storage/src/client.ts"), true);

  // 3. 平台系统管理套件 (platform/*) -> 判定为 true (框架核心)
  assert.equal(isFrameworkFile("packages/platform/tenant-admin/src/manifest.ts"), true);
  assert.equal(isFrameworkFile("packages/platform/control-admin/src/shared/server.ts"), true);

  // 4. 应用内核网关 (apps/*/src/kernel/*) -> 判定为 true (框架核心)
  assert.equal(isFrameworkFile("apps/tenant/src/kernel/workbench.ts"), true);
  assert.equal(isFrameworkFile("apps/tenant/src/kernel/navigation.ts"), true);

  // 5. 迁移与工程治理工具 (tooling/*, scripts/*, eslint) -> 判定为 true
  assert.equal(isFrameworkFile("tooling/db-migrate/src/cli.ts"), true);
  assert.equal(isFrameworkFile("scripts/verify.mjs"), true);
  assert.equal(isFrameworkFile("eslint.config.mjs"), true);
});

test("checkFrameworkTamper: 纯业务改动天然放行", () => {
  const businessChanges = [
    "packages/domains/customer-center/src/features/customer-management/service.ts",
    "packages/domains/customer-center/src/features/customer-management/actions.ts",
    "packages/domains/customer-center/src/features/customer-management/contract.ts",
  ];

  const result = checkFrameworkTamper(process.cwd(), businessChanges, false);
  assert.equal(result.passed, true);
  assert.equal(result.hasFrameworkChanges, false);
  assert.equal(result.frameworkFiles.length, 0);
});

test("checkFrameworkTamper: 未授权时拦截框架基础设施改动", () => {
  const mixedChanges = [
    "packages/domains/customer-center/src/features/customer-management/service.ts",
    "packages/base/db-tenant/prisma/schema.prisma", // 触碰 base
    "packages/platform/tenant-admin/src/features/org-management/service.ts", // 触碰 platform
  ];

  const result = checkFrameworkTamper(process.cwd(), mixedChanges, false);
  assert.equal(result.passed, false);
  assert.equal(result.hasFrameworkChanges, true);
  assert.equal(result.frameworkFiles.length, 2);
  assert.equal(result.confirmed, false);
});

test("checkFrameworkTamper: 人工显式确认授权后安全放行", () => {
  const frameworkChanges = [
    "packages/base/storage/src/presign.ts",
    "apps/tenant/src/kernel/workbench.ts",
  ];

  const result = checkFrameworkTamper(process.cwd(), frameworkChanges, true);
  assert.equal(result.passed, true);
  assert.equal(result.hasFrameworkChanges, true);
  assert.equal(result.frameworkFiles.length, 2);
  assert.equal(result.confirmed, true);
});
