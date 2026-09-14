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

test("CustomerCategoryTagService.listCategories 仅返回 ACTIVE 状态的分类选项", async () => {
  let passedWhere: any = null;
  const mockClient = {
    customerCategory: {
      findMany: async ({ where }: any) => {
        passedWhere = where;
        return [
          {
            categoryCode: "CAT_ACT_1",
            categoryName: "餐饮客户",
            parentCode: null,
            description: null,
            status: "ACTIVE",
          },
        ];
      },
    },
  };

  const options = await CustomerCategoryTagService.listCategories(
    mockClient as never,
    { status: "ACTIVE" },
  );
  assert.equal(passedWhere.status, "ACTIVE");
  assert.equal(options.length, 1);
  assert.equal(options[0]?.categoryCode, "CAT_ACT_1");
});

test("CustomerCategoryTagService.listTags 仅返回 ACTIVE 状态的标签选项", async () => {
  let passedWhere: any = null;
  const mockClient = {
    customerTag: {
      findMany: async ({ where }: any) => {
        passedWhere = where;
        return [
          {
            tagCode: "TAG_VIP",
            tagName: "重点客户",
            tagType: "VIP",
            description: null,
            status: "ACTIVE",
          },
        ];
      },
    },
  };

  const options = await CustomerCategoryTagService.listTags(
    mockClient as never,
    { tagType: "VIP", status: "ACTIVE" },
  );
  assert.equal(passedWhere.status, "ACTIVE");
  assert.equal(passedWhere.tagType, "VIP");
  assert.equal(options.length, 1);
  assert.equal(options[0]?.tagCode, "TAG_VIP");
});
