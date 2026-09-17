import test from "node:test";
import assert from "node:assert/strict";
import {
  checkRelationModeInContent,
  runRelationModeCheck,
} from "./check-relation-mode.mjs";

test("checkRelationModeInContent - 识别缺少 datasource", () => {
  const content = `
    generator client {
      provider = "prisma-client-js"
    }
  `;
  const errors = checkRelationModeInContent(content, "test.prisma");
  assert.equal(errors.length, 1);
  assert.match(errors[0].rule, /缺少 datasource/);
});

test("checkRelationModeInContent - 识别未配置 relationMode", () => {
  const content = `
    datasource db {
      provider = "postgresql"
    }
  `;
  const errors = checkRelationModeInContent(content, "test.prisma");
  assert.equal(errors.length, 1);
  assert.match(errors[0].rule, /未配置 relationMode/);
});

test("checkRelationModeInContent - 识别 relationMode 非 prisma", () => {
  const content = `
    datasource db {
      provider     = "postgresql"
      relationMode = "foreignKeys"
    }
  `;
  const errors = checkRelationModeInContent(content, "test.prisma");
  assert.equal(errors.length, 1);
  assert.match(errors[0].rule, /relationMode 配置值错误/);
});

test("checkRelationModeInContent - 合法的 relationMode = 'prisma'", () => {
  const content = `
    datasource db {
      provider     = "postgresql"
      relationMode = "prisma"
    }
  `;
  const errors = checkRelationModeInContent(content, "test.prisma");
  assert.equal(errors.length, 0);
});

test("runRelationModeCheck - 全仓现行租户 Schema 检测无违规", () => {
  const violations = runRelationModeCheck();
  assert.equal(
    violations.length,
    0,
    `发现意外违规: ${JSON.stringify(violations)}`,
  );
});
