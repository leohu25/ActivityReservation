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

test("CustomerCategoryTagService updateCategory 更新分类", async () => {
  let updatedData: any = null;
  const mockClient = {
    customerCategory: {
      findUnique: async () => ({ categoryCode: "CAT_001" }),
      update: async ({ data }: any) => {
        updatedData = data;
        return { categoryCode: "CAT_001", ...data };
      },
    },
  };

  await CustomerCategoryTagService.updateCategory(
    mockClient as never,
    "CAT_001",
    {
      categoryName: "餐饮连锁总部",
      parentCode: null,
      description: "更新说明",
    },
  );

  assert.equal(updatedData.categoryName, "餐饮连锁总部");
});

test("CustomerCategoryTagService deleteCategory 拦截有子分类或客户的删除", async () => {
  // 1. 拦截有子分类
  await assert.rejects(
    CustomerCategoryTagService.deleteCategory(
      {
        customerCategory: {
          count: async () => 2,
        },
      } as never,
      "CAT_PARENT",
    ),
    /尚有 2 个子级分类/,
  );

  // 2. 拦截有关联客户档案
  await assert.rejects(
    CustomerCategoryTagService.deleteCategory(
      {
        customerCategory: {
          count: async () => 0,
        },
        customer: {
          count: async () => 3,
        },
      } as never,
      "CAT_HAS_CUST",
    ),
    /仍有关联的有效客户档案/,
  );
});

test("CustomerCategoryTagService deleteTag 拦截已被使用的标签", async () => {
  await assert.rejects(
    CustomerCategoryTagService.deleteTag(
      {
        customerTagAssignment: {
          count: async () => 5,
        },
      } as never,
      "TAG_USED",
    ),
    /当前已被 5 个客户关联使用/,
  );
});
