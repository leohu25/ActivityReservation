import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  validateTsconfigPaths,
  stripJsonComments,
} from "./check-tsconfig-paths.mjs";

describe("check-tsconfig-paths", () => {
  test("正确剥离 JSONC 注释与尾随逗号且不破坏内部通配符与字符串", () => {
    const jsonc = `
      {
        // 单行注释
        /* 多行注释 */
        "compilerOptions": {
          "paths": {
            "@/*": ["./src/*"],
          },
        },
        "include": ["**/*.ts", "**/*.tsx",],
      }
    `;
    const clean = stripJsonComments(jsonc);
    const parsed = JSON.parse(clean);
    assert.deepEqual(parsed.compilerOptions.paths, { "@/*": ["./src/*"] });
    assert.deepEqual(parsed.include, ["**/*.ts", "**/*.tsx"]);
  });

  test("合规的包内路径映射校验通过", () => {
    const validConfig = `
      {
        "compilerOptions": {
          "baseUrl": ".",
          "paths": {
            "@/*": ["./src/*"],
            "#components/*": ["./src/components/*"]
          }
        }
      }
    `;
    const violations = validateTsconfigPaths(
      "/mock/packages/domains/demo/tsconfig.json",
      validConfig,
      "/mock",
    );
    assert.equal(violations.length, 0);
  });

  test("拦截跨包相对路径穿透 (以 .. 开头或包含 /../)", () => {
    const leakyConfig = `
      {
        "compilerOptions": {
          "baseUrl": ".",
          "paths": {
            "@/*": ["./src/*"],
            "@domain/base-archives/manifest": ["../../domains/base-archives/src/manifest.ts"]
          }
        }
      }
    `;
    const violations = validateTsconfigPaths(
      "/mock/packages/runtime/tenant/tsconfig.json",
      leakyConfig,
      "/mock",
    );
    assert.ok(violations.length >= 1);
    const hasLeakyError = violations.some((v) =>
      v.message.includes("严禁在子包 tsconfig.json 中覆写工作区包") ||
      v.message.includes("跨包相对路径穿透"),
    );
    assert.equal(hasLeakyError, true);
  });

  test("拦截在子包 tsconfig 中覆写工作区包名别名", () => {
    const aliasOverrideConfig = `
      {
        "compilerOptions": {
          "baseUrl": ".",
          "paths": {
            "@domain/product-center": ["./vendor/product-center"]
          }
        }
      }
    `;
    const violations = validateTsconfigPaths(
      "/mock/packages/runtime/tenant/tsconfig.json",
      aliasOverrideConfig,
      "/mock",
    );
    assert.ok(violations.length >= 1);
    assert.ok(
      violations[0].message.includes("严禁在子包 tsconfig.json 中覆写工作区包"),
    );
  });
});
