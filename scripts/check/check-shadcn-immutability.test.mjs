import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  checkWhitelist,
  checkIntegrity,
  computeFileHash,
  OFFICIAL_SHADCN_COMPONENTS,
} from "./check-shadcn-immutability.mjs";

test("checkWhitelist: 纯净官方组件与 index.ts 能够顺利通过白名单校验", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shadcn-test-"));
  try {
    fs.writeFileSync(path.join(tmpDir, "index.ts"), "// index");
    fs.writeFileSync(path.join(tmpDir, "button.tsx"), "// button");
    fs.writeFileSync(path.join(tmpDir, "dialog.tsx"), "// dialog");

    const res = checkWhitelist(tmpDir);
    assert.equal(res.ok, true);
    assert.equal(res.errors.length, 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("checkWhitelist: 目录内包含非官方自定义组件时严厉拦截", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shadcn-test-"));
  try {
    fs.writeFileSync(path.join(tmpDir, "button.tsx"), "// button");
    fs.writeFileSync(path.join(tmpDir, "my-custom-modal.tsx"), "// custom");

    const res = checkWhitelist(tmpDir);
    assert.equal(res.ok, false);
    assert.equal(res.errors.length, 1);
    assert.match(res.errors[0], /SHADCN-FORBIDDEN-CUSTOM-COMPONENT/);
    assert.match(res.errors[0], /my-custom-modal\.tsx/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("checkIntegrity: 组件被人工篡改/内容变动时准确报错拦截", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shadcn-test-"));
  try {
    const btnPath = path.join(tmpDir, "button.tsx");
    fs.writeFileSync(btnPath, "export const Button = () => null;");
    const originalHash = computeFileHash(btnPath);

    const manifestPath = path.join(tmpDir, ".shadcn-manifest.json");
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({
        version: "1.0.0",
        files: {
          "button.tsx": originalHash,
        },
      }),
    );

    // 1. 未变动前通过校验
    const resPass = checkIntegrity(tmpDir, manifestPath);
    assert.equal(resPass.ok, true);

    // 2. 人工篡改组件内容
    fs.writeFileSync(btnPath, "export const Button = () => 'tampered';");
    const resFail = checkIntegrity(tmpDir, manifestPath);
    assert.equal(resFail.ok, false);
    assert.match(resFail.errors[0], /SHADCN-FORBIDDEN-MODIFICATION/);
    assert.match(resFail.errors[0], /button\.tsx/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("OFFICIAL_SHADCN_COMPONENTS: 白名单包含所有 63 个官方 Base UI / base-nova 标准组件", () => {
  assert.equal(OFFICIAL_SHADCN_COMPONENTS.length, 63);
  assert.ok(OFFICIAL_SHADCN_COMPONENTS.includes("button"));
  assert.ok(OFFICIAL_SHADCN_COMPONENTS.includes("dialog"));
  assert.ok(OFFICIAL_SHADCN_COMPONENTS.includes("select"));
  assert.ok(OFFICIAL_SHADCN_COMPONENTS.includes("combobox"));
  assert.ok(OFFICIAL_SHADCN_COMPONENTS.includes("sidebar"));
  assert.ok(OFFICIAL_SHADCN_COMPONENTS.includes("sonner"));
});
