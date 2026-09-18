import test from "node:test";
import assert from "node:assert/strict";
import { CustomerService } from "./service";

test("CustomerService updateCustomerStatus 级联停用门店", async () => {
	let storesStatus = "";
	await CustomerService.updateCustomerStatus(
		{
			$transaction: async (fn: (tx: unknown) => unknown) =>
				fn({
					customer: {
						update: async ({ data }: { data: { status: string } }) => data,
					},
					customerStore: {
						updateMany: async ({ data }: { data: { status: string } }) => {
							storesStatus = data.status;
						},
					},
				}),
		} as never,
		"cust-001",
		"DISABLED",
		{ userId: "u-admin" },
	);
	assert.equal(storesStatus, "DISABLED");
});

test("CustomerService 创建客户时注入 createdById 与 deptId 基础审计字段", async () => {
	let createdData: any = null;
	const mockClient = {
		$transaction: async (fn: (tx: unknown) => unknown) =>
			fn({
				$executeRaw: async () => 0,
				$queryRaw: async () => [],
				customerCategory: {
					findUnique: async () => ({ id: "cat-1", name: "分类1" }),
				},
				customerTag: {
					findMany: async () => [],
				},
				customer: {
					create: async ({ data }: { data: any }) => {
						createdData = data;
						return { id: "cust-new-1", ...data };
					},
				},
			}),
	};

	await CustomerService.createCustomer(
		mockClient as never,
		{
			name: "测试企业客户",
			categoryId: "cat-1",
			contactPerson: "张三",
			contactPhone: "13800138000",
			settlementMethod: "MONTHLY",
		},
		{
			userId: "user-creator-123",
			deptId: "dept-sales-456",
		},
	);

	assert.ok(createdData);
	assert.equal(createdData.name, "测试企业客户");
	assert.equal(createdData.categoryId, "cat-1");
	assert.equal(createdData.createdById, "user-creator-123");
	assert.equal(createdData.updatedById, "user-creator-123");
	assert.equal(createdData.deptId, "dept-sales-456");
	assert.equal(createdData.isDeleted, false);
});

test("CustomerService listCustomers 注入 isDeleted: false 软删除与 accessibleWhere 物理过滤", async () => {
	let queriedWhere: any = null;
	const mockClient = {
		customer: {
			count: async ({ where }: { where: any }) => {
				queriedWhere = where;
				return 1;
			},
			findMany: async () => [],
		},
	};

	const accessibleWhere = { createdById: "user-creator-123" };
	await CustomerService.listCustomers(
		mockClient as never,
		{ status: "ACTIVE" },
		accessibleWhere,
	);

	assert.ok(queriedWhere);
	assert.ok(Array.isArray(queriedWhere.AND));
	// 验证包含 isDeleted: false
	assert.ok(
		queriedWhere.AND.some(
			(cond: any) => typeof cond === "object" && cond.isDeleted === false,
		),
	);
	// 验证包含 accessibleWhere 数据范围下推
	assert.ok(
		queriedWhere.AND.some(
			(cond: any) =>
				typeof cond === "object" && cond.createdById === "user-creator-123",
		),
	);
});

test("CustomerService deleteCustomer 执行软删除并记录审计信息", async () => {
	let updatedRecord: any = null;
	const mockClient = {
		customerStore: {
			count: async () => 0,
		},
		customerQuote: {
			count: async () => 0,
		},
		customer: {
			update: async ({ where, data }: { where: any; data: any }) => {
				updatedRecord = { where, data };
				return { id: where.id, ...data };
			},
		},
	};

	await CustomerService.deleteCustomer(mockClient as never, "cust-001", {
		userId: "user-remover-999",
	});

	assert.ok(updatedRecord);
	assert.equal(updatedRecord.data.isDeleted, true);
	assert.ok(updatedRecord.data.deletedAt instanceof Date);
	assert.equal(updatedRecord.data.deletedById, "user-remover-999");
});

test("CustomerService 拒绝删除有关联活跃门店或报价单的客户", async () => {
	await assert.rejects(
		CustomerService.deleteCustomer(
			{
				customerStore: { count: async () => 1 },
				customerQuote: { count: async () => 0 },
			} as never,
			"cust-001",
		),
		/禁止删除/,
	);
});
