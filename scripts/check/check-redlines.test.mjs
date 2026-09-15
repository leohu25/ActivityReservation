import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");
const scriptSource = await readFile(
  path.join(repositoryRoot, "scripts/check/check-redlines.mjs"),
  "utf8",
);

async function runFixture(files) {
  const root = await mkdtemp(path.join(tmpdir(), "base-redlines-"));
  try {
    await mkdir(path.join(root, "scripts/check"), { recursive: true });
    await writeFile(
      path.join(root, "scripts/check/check-redlines.mjs"),
      scriptSource,
    );
    for (const [relativePath, content] of Object.entries(files)) {
      const fullPath = path.join(root, relativePath);
      await mkdir(path.dirname(fullPath), { recursive: true });
      await writeFile(fullPath, content);
    }
    return spawnSync(process.execPath, ["scripts/check/check-redlines.mjs"], {
      cwd: root,
      encoding: "utf8",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("redline rejects direct Feature-to-Feature dependency", async () => {
  const result = await runFixture({
    "packages/features/a/package.json": JSON.stringify({
      name: "@base/feature-a",
      dependencies: { "@base/feature-b": "workspace:*" },
    }),
    "packages/features/a/src/index.ts":
      'import { value } from "@base/feature-b";\nexport { value };\n',
    "packages/features/b/package.json": JSON.stringify({
      name: "@base/feature-b",
    }),
    "packages/features/b/src/index.ts": "export const value = 1;\n",
  });

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /业务 Feature Package 禁止直接依赖另一个 Feature/,
  );
});

test("redline rejects horizontal platform package depending on Feature", async () => {
  const result = await runFixture({
    "packages/shared/package.json": JSON.stringify({
      name: "@base/shared",
      dependencies: { "@base/feature-a": "workspace:*" },
    }),
    "packages/shared/src/index.ts":
      'import { helper } from "@base/feature-a";\nexport { helper };\n',
    "packages/features/a/package.json": JSON.stringify({
      name: "@base/feature-a",
    }),
    "packages/features/a/src/index.ts": "export const helper = 1;\n",
  });

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /架构分层违规：@base\/shared 处于最底层纯工具\/契约地基/,
  );
});

test("redline rejects @base/ui depending on @base/authorization", async () => {
  const result = await runFixture({
    "packages/ui/package.json": JSON.stringify({
      name: "@base/ui",
      dependencies: { "@base/authorization": "workspace:*" },
    }),
    "packages/ui/src/index.ts":
      'import { useOptionalAbility } from "@base/authorization";\nexport { useOptionalAbility };\n',
    "packages/authorization/package.json": JSON.stringify({
      name: "@base/authorization",
    }),
    "packages/authorization/src/index.ts":
      "export const useOptionalAbility = () => null;\n",
  });

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /架构分层违规：@base\/ui 处于纯视觉\/交互地基，严禁直接依赖 \[@base\/authorization\]/,
  );
});

test("redline rejects @base/authorization depending on @base/ui", async () => {
  const result = await runFixture({
    "packages/authorization/package.json": JSON.stringify({
      name: "@base/authorization",
      dependencies: { "@base/ui": "workspace:*" },
    }),
    "packages/authorization/src/index.ts":
      'import { UiAbilityProvider } from "@base/ui";\nexport { UiAbilityProvider };\n',
    "packages/ui/package.json": JSON.stringify({
      name: "@base/ui",
    }),
    "packages/ui/src/index.ts":
      "export const UiAbilityProvider = () => null;\n",
  });

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /架构分层违规：@base\/authorization 安全横切面严禁反向依赖 @base\/ui/,
  );
});

test("redline rejects internal /src/ path penetration", async () => {
  const result = await runFixture({
    "apps/tenant/package.json": JSON.stringify({
      name: "tenant",
      dependencies: { "@base/shared": "workspace:*" },
    }),
    "apps/tenant/src/index.ts":
      'import { tool } from "@base/shared/src/tool";\nexport { tool };\n',
    "packages/shared/package.json": JSON.stringify({ name: "@base/shared" }),
    "packages/shared/src/tool.ts": "export const tool = 1;\n",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /严禁通过 \/src\/ 穿透工作区包内部实现/);
});

test("redline rejects raw select DOM in features package", async () => {
  const result = await runFixture({
    "packages/features/demo/package.json": JSON.stringify({
      name: "@base/feature-demo",
    }),
    "packages/features/demo/src/DemoView.tsx":
      'export function Demo() { return <select><option value="1">1</option></select>; }\n',
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /严禁在业务切片内手写原生 <select> DOM/);
});

test("redline rejects raw active/disabled status magic strings in business code", async () => {
  const result = await runFixture({
    "packages/features/demo/package.json": JSON.stringify({
      name: "@base/feature-demo",
    }),
    "packages/features/demo/src/DemoView.tsx":
      'export function isLive(s: string) { return s.status === "ACTIVE"; }\n',
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /严禁在业务代码中裸写主数据启停状态魔法值/);
});

test("redline rejects platform-specific shell scripts (*.sh)", async () => {
  const result = await runFixture({
    "packages/shared/package.json": JSON.stringify({
      name: "@base/shared",
    }),
    "packages/shared/src/index.ts": "export const ok = 1;\n",
    "scripts/legacy.sh": "#!/usr/bin/env bash\necho 1\n",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /严禁在仓库中新增平台相关的 Shell 脚本/);
});
