import test from "node:test";
import assert from "node:assert/strict";
import { createPermissionCatalog } from "../core/catalog";
import { createTenantSliceContext } from "./tenant-slice-context";

test("createTenantSliceContext 能够产出 getContext 和 assertAbility 方法", () => {
	const catalog = createPermissionCatalog([
		{
			resource: "archive.dict",
			subject: "TenantDictItem",
			actions: ["read", "create", "update", "delete"] as const,
		},
	]);

	const sliceFactory = createTenantSliceContext(catalog);

	assert.equal(typeof sliceFactory.getContext, "function");
	assert.equal(typeof sliceFactory.assertAbility, "function");
});
