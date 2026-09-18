import test from "node:test";
import assert from "node:assert/strict";
import { MasterDataStatus } from "@base/shared";
import { CustomerCategoryService } from "./service";

test("CustomerCategoryService 构建多级分类树", async () => {
	const tree = await CustomerCategoryService.getCategoryTree({
		customerCategory: {
			findMany: async () => [
				{
					id: "ROOT",
					name: "根分类",
					parentId: null,
					description: null,
					status: MasterDataStatus.ACTIVE,
				},
				{
					id: "CHILD",
					name: "子分类",
					parentId: "ROOT",
					description: null,
					status: MasterDataStatus.ACTIVE,
				},
			],
		},
	} as never);
	assert.equal(tree.length, 1);
	assert.equal(tree[0]?.children?.[0]?.id, "CHILD");
});

test("CustomerCategoryService deleteCategory 拦截有子分类或关联客户的删除", async () => {
	await assert.rejects(
		CustomerCategoryService.deleteCategory(
			{
				customerCategory: { count: async () => 2 },
			} as never,
			"CAT_PARENT",
		),
		/尚有 2 个子级分类/,
	);

	await assert.rejects(
		CustomerCategoryService.deleteCategory(
			{
				customerCategory: { count: async () => 0 },
				customer: { count: async () => 3 },
			} as never,
			"CAT_HAS_CUST",
		),
		/仍有关联的有效客户档案/,
	);
});
