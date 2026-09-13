import test from "node:test";
import assert from "node:assert/strict";
import {
  itemCategoryPageContract,
  itemGradePageContract,
  itemVarietyPageContract,
} from "./contract";

test("分类、品种与等级使用独立 Subject/Resource 契约", () => {
  assert.deepEqual(
    [
      itemCategoryPageContract.subject,
      itemVarietyPageContract.subject,
      itemGradePageContract.subject,
    ],
    ["ItemCategory", "ItemVariety", "ItemGrade"],
  );
  assert.deepEqual(
    [
      itemCategoryPageContract.resource,
      itemVarietyPageContract.resource,
      itemGradePageContract.resource,
    ],
    [
      "material.item_category",
      "material.item_variety",
      "material.item_grade",
    ],
  );
  assert.equal(itemCategoryPageContract.path, "/materials/categories");
  const actions = itemCategoryPageContract.actions.map((a) => a.action);
  assert.ok(actions.includes("read"));
  assert.ok(actions.includes("create"));
  assert.ok(actions.includes("update"));
  assert.ok(actions.includes("delete"));
  assert.ok(actions.includes("toggle_status"));
});
