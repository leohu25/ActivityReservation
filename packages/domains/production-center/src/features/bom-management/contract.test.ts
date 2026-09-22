import test from "node:test";
import assert from "node:assert/strict";
import {
	BomSubject,
	BomVersionSubject,
	ProductDefaultBomSubject,
	BomAction,
	BOM_TYPES,
	BOM_TYPE_OPTIONS,
	QUANTITY_MODES,
	BOM_VERSION_STATUS,
	bomSearchParams,
	bomPageContract,
} from "./contract";
import { StandardAction } from "@base/authorization";

test("bom.contract: bomSearchParams 参数解析与默认值", async () => {
	const parsed = await bomSearchParams.parse(
		Promise.resolve({
			page: "2",
			pageSize: "20",
			keyword: "青椒",
			bomType: "PROCESSING",
			categoryId: "cat-123",
		}),
	);
	assert.deepEqual(parsed, {
		page: 2,
		pageSize: 20,
		keyword: "青椒",
		bomType: "PROCESSING",
		categoryId: "cat-123",
		status: "",
	});
});

test("bom.contract: BOM 权限契约与 Subject 常量完整性", () => {
	assert.equal(BomSubject, "Bom");
	assert.equal(BomVersionSubject, "BomVersion");
	assert.equal(ProductDefaultBomSubject, "ProductDefaultBom");
	assert.equal(bomPageContract.path, "/production/bom");

	const actionNames = bomPageContract.actions.map((a) => a.action);
	assert.ok(actionNames.includes(StandardAction.READ));
	assert.ok(actionNames.includes(StandardAction.CREATE));
	assert.ok(actionNames.includes(StandardAction.UPDATE));
	assert.ok(actionNames.includes(StandardAction.DELETE));
	assert.ok(actionNames.includes(BomAction.PUBLISH));
	assert.ok(actionNames.includes(BomAction.SET_DEFAULT));
});

test("bom.contract: BOM 核心枚举完整性", () => {
	assert.equal(BOM_TYPES.PROCESSING, "PROCESSING");
	assert.equal(BOM_TYPES.FORMULA, "FORMULA");
	assert.equal(BOM_TYPES.PACKAGING, "PACKAGING");

	assert.equal(QUANTITY_MODES.FIXED, "FIXED");
	assert.equal(QUANTITY_MODES.RATIO, "RATIO");

	assert.equal(BOM_VERSION_STATUS.DRAFT, "DRAFT");
	assert.equal(BOM_VERSION_STATUS.PUBLISHED, "PUBLISHED");
	assert.equal(BOM_VERSION_STATUS.RETIRED, "RETIRED");

	assert.equal(BOM_TYPE_OPTIONS.length, 4);
});
