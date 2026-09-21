import test from "node:test";
import assert from "node:assert/strict";
import { createMongoAbility, ForbiddenError } from "@casl/ability";
import type { AppAbility } from "@base/authorization";
import { assertBaseArchivesAbility } from "./context";
import { TenantDictItemSubject } from "../../features/dict/contract";

test("assertBaseArchivesAbility：有权限放行，无权限抛 ForbiddenError", () => {
	const allowed = createMongoAbility([
		{ action: "create", subject: TenantDictItemSubject },
	]) as unknown as AppAbility<string, string>;

	assert.doesNotThrow(() =>
		assertBaseArchivesAbility(allowed, "create", TenantDictItemSubject),
	);

	assert.throws(
		() => assertBaseArchivesAbility(allowed, "delete", TenantDictItemSubject),
		ForbiddenError,
	);
});
