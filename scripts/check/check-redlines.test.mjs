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
  const root = await mkdtemp(path.join(tmpdir(), "chenrun-redlines-"));
  try {
    await mkdir(path.join(root, "scripts/check"), { recursive: true });
    await writeFile(path.join(root, "scripts/check/check-redlines.mjs"), scriptSource);
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
      name: "@chenrun/feature-a",
      dependencies: { "@chenrun/feature-b": "workspace:*" },
    }),
    "packages/features/a/src/index.ts":
      'import { value } from "@chenrun/feature-b";\nexport { value };\n',
    "packages/features/b/package.json": JSON.stringify({
      name: "@chenrun/feature-b",
    }),
    "packages/features/b/src/index.ts": "export const value = 1;\n",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /业务 Feature Package 禁止直接依赖另一个 Feature/);
});

test("redline rejects horizontal platform package depending on Feature", async () => {
  const result = await runFixture({
    "packages/shared/package.json": JSON.stringify({
      name: "@chenrun/shared",
      dependencies: { "@chenrun/feature-a": "workspace:*" },
    }),
    "packages/shared/src/index.ts":
      'import { helper } from "@chenrun/feature-a";\nexport { helper };\n',
    "packages/features/a/package.json": JSON.stringify({
      name: "@chenrun/feature-a",
    }),
    "packages/features/a/src/index.ts": "export const helper = 1;\n",
  });

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /Horizontal Shared \/ Platform Module 禁止反向依赖业务 Feature/,
  );
});

test("redline rejects internal /src/ path penetration", async () => {
  const result = await runFixture({
    "apps/tenant/package.json": JSON.stringify({
      name: "tenant",
      dependencies: { "@chenrun/shared": "workspace:*" },
    }),
    "apps/tenant/src/index.ts":
      'import { tool } from "@chenrun/shared/src/tool";\nexport { tool };\n',
    "packages/shared/package.json": JSON.stringify({ name: "@chenrun/shared" }),
    "packages/shared/src/tool.ts": "export const tool = 1;\n",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /严禁通过 \/src\/ 穿透工作区包内部实现/);
});
