import test from "node:test";
import assert from "node:assert/strict";
import { ProcessingSpecificationService } from "./specification/service";

test("specification.service: 校验同一工序内规格编码不能重复", async () => {
	const mockTx = {} as never;

	await assert.rejects(
		async () => {
			await ProcessingSpecificationService.syncOperationSpecifications(
				mockTx,
				"op_1",
				[
					{ code: "CUT_3MM", name: "切片3mm" },
					{ code: "cut_3mm", name: "重名切片" }, // 忽略大小写重名
				],
				{ userId: "user_1" },
			);
		},
		{
			message: "同一工序下的工艺规格编码不能重复",
		},
	);
});
