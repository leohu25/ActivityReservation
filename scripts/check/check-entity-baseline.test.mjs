import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  validateModelBaseline,
  parsePrismaModels,
  EXEMPT_MODELS,
} from "./check-entity-baseline.mjs";

describe("check-entity-baseline", () => {
  test("豁免清单模型直接通过", () => {
    for (const model of EXEMPT_MODELS) {
      const res = validateModelBaseline(model, new Map());
      assert.equal(res.ok, true);
      assert.equal(res.errors.length, 0);
    }
  });

  test("业务实体缺失审计与软删除字段时报错", () => {
    const rawSchema = `
      model IncompleteModel {
        id   String @id
        name String
      }
    `;
    const models = parsePrismaModels(rawSchema);
    const incomplete = models.get("IncompleteModel");
    assert.ok(incomplete);

    const res = validateModelBaseline("IncompleteModel", incomplete);
    assert.equal(res.ok, false);
    assert.ok(res.errors.length >= 6);
  });

  test("业务实体具有完整合规字段时校验通过", () => {
    const rawSchema = `
      model CompliantModel {
        id          String    @id
        createdById String    @map("created_by_id")
        deptId      String?   @map("dept_id")
        updatedById String?   @map("updated_by_id")
        createdAt   DateTime  @default(now()) @map("created_at")
        updatedAt   DateTime  @updatedAt @map("updated_at")
        isDeleted   Boolean   @default(false) @map("is_deleted")
        deletedAt   DateTime? @map("deleted_at")
        deletedById String?   @map("deleted_by_id")
      }
    `;
    const models = parsePrismaModels(rawSchema);
    const compliant = models.get("CompliantModel");
    assert.ok(compliant);

    const res = validateModelBaseline("CompliantModel", compliant);
    assert.equal(res.ok, true);
    assert.equal(res.errors.length, 0);
  });
});
