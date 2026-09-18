import test from "node:test";
import assert from "node:assert/strict";
import { createMongoAbility, ForbiddenError } from "@casl/ability";
import {
	StandardAction,
	assertEditableFields,
	type AppAbility,
} from "@base/authorization";
import { assertCustomerAbility } from "./context";
import { customerCatalog } from "../../catalog";
import { CustomerSubject } from "../../features/customer-management/contract";
import { CustomerCategorySubject } from "../../features/customer-management/category/contract";
import { CustomerTagSubject } from "../../features/customer-management/tag/contract";

test("assertCustomerAbility：有权限放行，无权限抛 ForbiddenError", () => {
	const allowed = createMongoAbility([
		{ action: "create", subject: CustomerSubject },
	]) as unknown as AppAbility<string, string>;
	assert.doesNotThrow(() =>
		assertCustomerAbility(allowed, "create", CustomerSubject),
	);
	assert.throws(
		() => assertCustomerAbility(allowed, "delete", CustomerSubject),
		ForbiddenError,
	);
});

test("分类与标签管理端强校验：无独立分类/标签权限时严格抛出 ForbiddenError", () => {
	// 场景：用户被关掉了“客户分类”和“客户标签”权限，仅拥有“客户档案”读取权限
	const customerOnlyAbility = createMongoAbility([
		{ action: StandardAction.READ, subject: CustomerSubject },
	]) as unknown as AppAbility<string, string>;

	// 1. 管理端必须严格拦截：无 CustomerCategorySubject 权限禁止访问后台分类管理
	assert.equal(
		customerOnlyAbility.can(StandardAction.READ, CustomerCategorySubject),
		false,
	);
	assert.throws(
		() =>
			assertCustomerAbility(
				customerOnlyAbility,
				StandardAction.READ,
				CustomerCategorySubject,
			),
		ForbiddenError,
	);

	// 2. 标签管理端同理严格拦截
	assert.equal(
		customerOnlyAbility.can(StandardAction.READ, CustomerTagSubject),
		false,
	);
	assert.throws(
		() =>
			assertCustomerAbility(
				customerOnlyAbility,
				StandardAction.READ,
				CustomerTagSubject,
			),
		ForbiddenError,
	);
});

test("customerCatalog 从契约派生 Customer 动作（含 toggle_status）", () => {
	const def = customerCatalog.resolveBySubject(CustomerSubject);
	assert.ok(def);
	assert.ok(def.actions.includes("toggle_status"));
	assert.ok(def.actions.includes("create"));
	assert.ok(def.actions.includes("export"));
});

test("assertEditableFields [写路径防篡改]: 拦截对只读或隐藏字段的越权篡改", () => {
	// 构造 ability：允许更新 Customer，但限制仅可写 customerName，授信额度 creditLimit 不可写
	const limitedAbility = createMongoAbility([
		{
			action: "update",
			subject: CustomerSubject,
			fields: ["customerName", "contactPerson"],
		},
	]);

	// 1. 提交合法字段：正常放行
	assert.doesNotThrow(() => {
		assertEditableFields(limitedAbility, CustomerSubject, {
			customerName: "新客户名称",
			contactPerson: "新联系人",
		});
	});

	// 2. 越权提交未授权字段 creditLimit：必须抛出 ForbiddenError 物理拦截
	assert.throws(
		() => {
			assertEditableFields(limitedAbility, CustomerSubject, {
				customerName: "新客户名称",
				creditLimit: 999999,
			});
		},
		(err: unknown) => {
			assert.ok(err instanceof ForbiddenError);
			assert.match(
				(err as Error).message,
				/禁止修改 Customer 的非编辑或隐藏字段: creditLimit/,
			);
			return true;
		},
	);
});
