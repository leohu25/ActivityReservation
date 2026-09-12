import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { checkVerticalSlices } from "./check-vertical-slices.mjs";

async function createFixture(files) {
  const root = await mkdtemp(path.join(tmpdir(), "chenrun-vertical-slice-"));
  await writeFile(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - 'packages/**'\n");
  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = path.join(root, relativePath);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content);
  }
  return root;
}

function createValidFeatureFiles(pkgDir = "packages/features/demo-feature") {
  return {
    [`${pkgDir}/package.json`]: JSON.stringify({
      name: "@chenrun/feature-demo",
      exports: {
        "./manifest": "./src/manifest.ts",
        "./catalog": "./src/catalog.ts",
        "./order-management": "./src/features/order-management/public.ts",
        "./order-management/server": "./src/features/order-management/public.server.ts",
        "./shared": "./src/shared/public.ts",
      },
    }),
    [`${pkgDir}/src/manifest.ts`]: "export const demoManifest = {};\n",
    [`${pkgDir}/src/catalog.ts`]: "export const demoCatalog = {};\n",
    [`${pkgDir}/src/shared/server/context.ts`]: "export const getContext = () => {};\n",
    [`${pkgDir}/src/shared/public.ts`]: "export const SharedBoundary = () => null;\n",
    [`${pkgDir}/src/features/order-management/contract.ts`]: "export const OrderSubject = 'Order';\n",
    [`${pkgDir}/src/features/order-management/types.ts`]: "export interface OrderItem { id: string; }\n",
    [`${pkgDir}/src/features/order-management/service.ts`]: "export class OrderService {}\n",
    [`${pkgDir}/src/features/order-management/queries.ts`]: 'import "server-only";\nexport async function listOrders() {}\n',
    [`${pkgDir}/src/features/order-management/actions.ts`]: '"use server";\nexport async function createOrder() {}\n',
    [`${pkgDir}/src/features/order-management/public.ts`]: "export * from './contract';\n",
    [`${pkgDir}/src/features/order-management/public.server.ts`]: 'import "server-only";\nexport * from "./queries";\n',
  };
}

test("checkVerticalSlices: valid vertical slice package passes with zero violations", async () => {
  const root = await createFixture(createValidFeatureFiles());
  try {
    const { violations } = checkVerticalSlices(root);
    assert.equal(violations.length, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("checkVerticalSlices: rejects missing base contracts (manifest.ts, catalog.ts, shared/server)", async () => {
  const files = createValidFeatureFiles();
  delete files["packages/features/demo-feature/src/manifest.ts"];
  delete files["packages/features/demo-feature/src/catalog.ts"];
  delete files["packages/features/demo-feature/src/shared/server/context.ts"];

  const root = await createFixture(files);
  try {
    const { violations } = checkVerticalSlices(root);
    assert.equal(violations.length, 3);
    assert(violations.some((v) => v.rule.includes("src/manifest.ts")));
    assert(violations.some((v) => v.rule.includes("src/catalog.ts")));
    assert(violations.some((v) => v.rule.includes("src/shared/server/")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("checkVerticalSlices: rejects package.json with root barrel export '.'", async () => {
  const files = createValidFeatureFiles();
  const pkg = JSON.parse(files["packages/features/demo-feature/package.json"]);
  pkg.exports["."] = "./src/index.ts";
  files["packages/features/demo-feature/package.json"] = JSON.stringify(pkg);

  const root = await createFixture(files);
  try {
    const { violations } = checkVerticalSlices(root);
    assert(violations.some((v) => v.rule.includes('严禁导出根路径 "."')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("checkVerticalSlices: rejects residual retired flat files in src root", async () => {
  const files = {
    ...createValidFeatureFiles(),
    "packages/features/demo-feature/src/index.ts": "export * from './manifest';\n",
    "packages/features/demo-feature/src/actions.ts": "export const a = 1;\n",
    "packages/features/demo-feature/src/services/foo.ts": "export class Foo {}\n",
  };

  const root = await createFixture(files);
  try {
    const { violations } = checkVerticalSlices(root);
    assert(violations.some((v) => v.code === "index.ts"));
    assert(violations.some((v) => v.code === "actions.ts"));
    assert(violations.some((v) => v.code === "services"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("checkVerticalSlices: rejects slice missing public.ts or contract.ts", async () => {
  const files = createValidFeatureFiles();
  delete files["packages/features/demo-feature/src/features/order-management/contract.ts"];
  delete files["packages/features/demo-feature/src/features/order-management/public.ts"];

  const root = await createFixture(files);
  try {
    const { violations } = checkVerticalSlices(root);
    assert(violations.some((v) => v.rule.includes("public.ts")));
    assert(violations.some((v) => v.rule.includes("contract.ts")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("checkVerticalSlices: rejects queries.ts without server-only or actions.ts without use server", async () => {
  const files = createValidFeatureFiles();
  files["packages/features/demo-feature/src/features/order-management/queries.ts"] =
    "export async function listOrders() {}\n";
  files["packages/features/demo-feature/src/features/order-management/actions.ts"] =
    "export async function createOrder() {}\n";

  const root = await createFixture(files);
  try {
    const { violations } = checkVerticalSlices(root);
    assert(violations.some((v) => v.rule.includes('import "server-only"')));
    assert(violations.some((v) => v.rule.includes('"use server"')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("checkVerticalSlices: rejects Client-Safe public.ts or ui/ importing db-tenant or next/headers", async () => {
  const files = createValidFeatureFiles();
  files["packages/features/demo-feature/src/features/order-management/public.ts"] =
    'import { headers } from "next/headers";\nexport * from "./contract";\n';
  files["packages/features/demo-feature/src/features/order-management/ui/OrderView.tsx"] =
    'import { TenantPrismaClient } from "@chenrun/db-tenant";\nexport const OrderView = () => null;\n';

  const root = await createFixture(files);
  try {
    const { violations } = checkVerticalSlices(root);
    assert(violations.some((v) => v.file.endsWith("public.ts") && v.rule.includes("Client-Safe API")));
    assert(violations.some((v) => v.file.endsWith("OrderView.tsx") && v.rule.includes("UI 组件严禁导入数据库")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("checkVerticalSlices: rejects slice directly importing sibling slice private service", async () => {
  const files = {
    ...createValidFeatureFiles(),
    "packages/features/demo-feature/package.json": JSON.stringify({
      name: "@chenrun/feature-demo",
      exports: {
        "./manifest": "./src/manifest.ts",
        "./catalog": "./src/catalog.ts",
        "./order-management": "./src/features/order-management/public.ts",
        "./order-management/server": "./src/features/order-management/public.server.ts",
        "./payment-management": "./src/features/payment-management/public.ts",
        "./payment-management/server": "./src/features/payment-management/public.server.ts",
        "./shared": "./src/shared/public.ts",
      },
    }),
    "packages/features/demo-feature/src/features/payment-management/contract.ts": "export const PaymentSubject = 'Payment';\n",
    "packages/features/demo-feature/src/features/payment-management/types.ts": "export interface PaymentItem {}\n",
    "packages/features/demo-feature/src/features/payment-management/service.ts": "export class PaymentService {}\n",
    "packages/features/demo-feature/src/features/payment-management/queries.ts": 'import "server-only";\nexport async function getPayment() {}\n',
    "packages/features/demo-feature/src/features/payment-management/actions.ts": '"use server";\nexport async function pay() {}\n',
    "packages/features/demo-feature/src/features/payment-management/public.ts": "export * from './contract';\n",
    "packages/features/demo-feature/src/features/payment-management/public.server.ts": 'import "server-only";\nexport * from "./queries";\n',
    "packages/features/demo-feature/src/features/payment-management/actions.ts":
      '"use server";\nimport { OrderService } from "../order-management/service";\nexport async function pay() {}\n',
  };

  const root = await createFixture(files);
  try {
    const { violations } = checkVerticalSlices(root);
    assert(violations.some((v) => v.rule.includes("严禁通过相对路径直接调用兄弟切片私有实现")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
