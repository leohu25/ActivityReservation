import test from "node:test";
import assert from "node:assert/strict";
import { CustomerTagService } from "./service";

test("CustomerTagService deleteTag 拦截已被客户关联使用的标签", async () => {
	await assert.rejects(
		CustomerTagService.deleteTag(
			{
				customerTagAssignment: { count: async () => 5 },
			} as never,
			"TAG_USED",
		),
		/当前已被 5 个客户关联使用/,
	);
});
