import test from "node:test";
import assert from "node:assert/strict";
import {
	TenantDictItemSubject,
	TenantDictItemResource,
	TenantDictItemField,
	dictItemSearchParams,
	tenantDictItemPageContract,
	TenantDictItemAction,
	DICT_TYPES,
} from "./contract";
import { StandardAction } from "@base/authorization";

test("dict.contract: dictItemSearchParams 参数解析与默认值", async () => {
	const parsed = await dictItemSearchParams.parse(
		Promise.resolve({
			page: "2",
			pageSize: "50",
			keyword: "CUSTOMER",
			type: DICT_TYPES.CUSTOMER_LEVEL,
			status: "ACTIVE",
		}),
	);
	assert.deepEqual(parsed, {
		page: 2,
		pageSize: 50,
		keyword: "CUSTOMER",
		type: DICT_TYPES.CUSTOMER_LEVEL,
		status: "ACTIVE",
	});
});

test("dict.contract: 数据字典契约基本元数据完整性", () => {
	assert.equal(TenantDictItemSubject, "TenantDictItem");
	assert.equal(TenantDictItemResource, "base_archives.dict");
	assert.equal(tenantDictItemPageContract.path, "/archives/dict");

	const actionNames = tenantDictItemPageContract.actions.map((a) => a.action);
	assert.ok(actionNames.includes(StandardAction.READ));
	assert.ok(actionNames.includes(StandardAction.CREATE));
	assert.ok(actionNames.includes(StandardAction.UPDATE));
	assert.ok(actionNames.includes(StandardAction.DELETE));
	assert.ok(actionNames.includes(TenantDictItemAction.TOGGLE_STATUS));

	assert.equal(TenantDictItemField.TYPE, "type");
	assert.equal(TenantDictItemField.CODE, "code");
	assert.equal(TenantDictItemField.NAME, "name");
	assert.equal(TenantDictItemField.STATUS, "status");
	assert.equal(TenantDictItemField.SORT, "sort");
});

test("dict.contract: DICT_TYPES 常量完整性与不可篡改", () => {
	assert.equal(DICT_TYPES.CUSTOMER_LEVEL, "CUSTOMER_LEVEL");
	assert.equal(DICT_TYPES.CUSTOMER_SOURCE, "CUSTOMER_SOURCE");
	assert.equal(DICT_TYPES.INDUSTRY_TYPE, "INDUSTRY_TYPE");
	assert.equal(DICT_TYPES.SETTLEMENT_TYPE, "SETTLEMENT_TYPE");
	assert.equal(DICT_TYPES.CUSTOMER_TAG_TYPE, "CUSTOMER_TAG_TYPE");
	assert.equal(DICT_TYPES.TAG_BUSINESS_TYPE, "TAG_BUSINESS_TYPE");
});
