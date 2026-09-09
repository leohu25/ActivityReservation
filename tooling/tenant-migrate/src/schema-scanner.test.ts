import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {
  findTenantSchemaFiles,
  extractModelsAndEnums,
  aggregateTenantSchemas,
} from "./schema-scanner";

test("findTenantSchemaFiles 能够自动定位 db-tenant 与业务 feature 中的 schema", () => {
  const workspaceRoot = path.resolve(import.meta.dirname, "../../..");
  const files = findTenantSchemaFiles(workspaceRoot);

  assert.ok(
    files.length >= 2,
    `预期至少找到 2 个 Schema，实际找到: ${files.length}`,
  );
  assert.ok(
    files.some((f) => f.includes("packages/db-tenant/prisma/schema.prisma")),
  );
  assert.ok(
    files.some((f) =>
      f.includes("packages/features/customer-center/prisma/schema.prisma"),
    ),
  );
});

test("extractModelsAndEnums 能正确从 schema 中解析出 model 与 enum 代码块", () => {
  const sample = `
datasource db {
  provider = "postgresql"
}

enum RoleType {
  ADMIN
  USER
}

model SampleModel {
  id String @id
}
  `;

  const { models, enums } = extractModelsAndEnums(sample);
  assert.equal(models.length, 1);
  assert.equal(enums.length, 1);
  assert.ok(models[0].includes("SampleModel"));
  assert.ok(enums[0].includes("RoleType"));
});

test("aggregateTenantSchemas 生成的聚合 schema 包含全部实体模型", () => {
  const workspaceRoot = path.resolve(import.meta.dirname, "../../..");
  const aggregated = aggregateTenantSchemas(workspaceRoot);

  assert.ok(aggregated.includes("model Department"));
  assert.ok(aggregated.includes("model CompanyProfile"));
  assert.ok(aggregated.includes("model Customer"));
  assert.ok(aggregated.includes("model CustomerQuote"));
});
