import test from "node:test";
import assert from "node:assert/strict";
import { StandardAction } from "@base/authorization";
import {
	OperationSubject,
	OperationResource,
	OperationField,
	ProcessingSpecificationSubject,
	ProcessingSpecificationField,
	operationSearchParams,
	processPageContract,
	ProcessAction,
} from "./contract";

test("process.contract: operationSearchParams 正常解析 URL 查询参数与默认值", async () => {
	const parsed = await operationSearchParams.parse(
		Promise.resolve({
			page: "2",
			pageSize: "30",
			keyword: "切配",
			categoryId: "cat_uuid_1",
			status: "ACTIVE",
		}),
	);

	assert.deepEqual(parsed, {
		page: 2,
		pageSize: 30,
		keyword: "切配",
		categoryId: "cat_uuid_1",
		status: "ACTIVE",
	});
});

test("process.contract: 权限契约与受控字段元数据校验", () => {
	assert.equal(OperationSubject, "Operation");
	assert.equal(OperationResource, "production_center.operation");
	assert.equal(ProcessingSpecificationSubject, "ProcessingSpecification");
	assert.equal(processPageContract.path, "/production/operations");

	const actionNames = processPageContract.actions.map((a) => a.action);
	assert.ok(actionNames.includes(StandardAction.READ));
	assert.ok(actionNames.includes(StandardAction.CREATE));
	assert.ok(actionNames.includes(StandardAction.UPDATE));
	assert.ok(actionNames.includes(StandardAction.DELETE));
	assert.ok(actionNames.includes(ProcessAction.TOGGLE_STATUS));

	assert.equal(OperationField.CODE, "code");
	assert.equal(OperationField.NAME, "name");
	assert.equal(ProcessingSpecificationField.CODE, "code");
	assert.equal(ProcessingSpecificationField.DEFAULT_YIELD_RATE, "defaultYieldRate");
});
