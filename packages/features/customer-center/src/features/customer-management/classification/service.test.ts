import test from "node:test";
import assert from "node:assert/strict";
import { CustomerCategoryTagService } from "./service";

test("CustomerCategoryTagService 构建多级分类树", async () => {
  const tree = await CustomerCategoryTagService.getCategoryTree({
    customerCategory: {
      findMany: async () => [
        {
          categoryCode: "ROOT",
          categoryName: "根",
          parentCode: null,
          description: null,
          status: "ACTIVE",
        },
        {
          categoryCode: "CHILD",
          categoryName: "子",
          parentCode: "ROOT",
          description: null,
          status: "ACTIVE",
        },
      ],
    },
  } as never);
  assert.equal(tree.length, 1);
  assert.equal(tree[0]?.children[0]?.categoryCode, "CHILD");
});
