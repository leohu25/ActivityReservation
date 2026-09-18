import { MasterDataStatus, resolvePagination } from "@base/shared";
import type { TenantPrismaClient, TenantPrisma } from "@base/db-tenant";
import type { PrismaQueryCondition } from "@base/authorization";
import type {
	CreateCustomerInput,
	ListCustomerFilter,
	UpdateCustomerInput,
} from "./types";

export interface ListCustomersResult {
	items: Awaited<ReturnType<TenantPrismaClient["customer"]["findMany"]>>;
	total: number;
	page: number;
	pageSize: number;
}

export interface CustomerAuditContext {
	userId: string;
	deptId?: string | null;
}

export class CustomerService {
	/**
	 * 查询客户列表（服务端分页：count + skip/take，禁止全量返回）
	 * 严格注入 accessibleWhere 数据范围过滤与 isDeleted: false 软删除物理过滤 (Fail-Closed)
	 */
	static async listCustomers(
		client: TenantPrismaClient,
		filter: ListCustomerFilter = {},
		accessibleWhere?: PrismaQueryCondition,
	): Promise<ListCustomersResult> {
		const { page, pageSize, skip, take } = resolvePagination(filter, {
			defaultPageSize: 20,
		});

		const andConditions: TenantPrisma.CustomerWhereInput[] = [
			{ isDeleted: false },
		];

		if (accessibleWhere && Object.keys(accessibleWhere).length > 0) {
			andConditions.push(accessibleWhere as TenantPrisma.CustomerWhereInput);
		}

		if (filter.categoryId) {
			andConditions.push({ categoryId: filter.categoryId });
		}
		if (filter.status) {
			andConditions.push({ status: filter.status });
		}
		if (filter.keyword) {
			const q = filter.keyword.trim().slice(0, 100);
			andConditions.push({
				OR: [
					{ name: { contains: q, mode: "insensitive" } },
					{ contactPerson: { contains: q, mode: "insensitive" } },
					{ contactPhone: { contains: q, mode: "insensitive" } },
				],
			});
		}
		if (filter.tagId) {
			andConditions.push({
				tagAssignments: {
					some: {
						tagId: filter.tagId,
					},
				},
			});
		}

		const where = andConditions.length > 0 ? { AND: andConditions } : {};

		const include = {
			category: true,
			tagAssignments: {
				include: {
					tag: true,
				},
			},
			_count: {
				select: {
					stores: true,
					quotes: true,
				},
			},
		} as const;

		const [total, items] = await Promise.all([
			client.customer.count({ where }),
			client.customer.findMany({
				where,
				include,
				orderBy: { createdAt: "desc" },
				skip,
				take,
			}),
		]);

		return { items, total, page, pageSize };
	}

	/**
	 * 获取客户详情（默认过滤软删除记录）
	 */
	static async getCustomer(client: TenantPrismaClient, id: string) {
		const customer = await client.customer.findUnique({
			where: { id },
			include: {
				category: true,
				tagAssignments: {
					include: {
						tag: true,
					},
				},
				stores: true,
				quotes: true,
			},
		});
		if (customer && customer.isDeleted) {
			return null;
		}
		return customer;
	}

	/**
	 * 创建客户档案
	 */
	static async createCustomer(
		client: TenantPrismaClient,
		input: CreateCustomerInput,
		auditCtx: CustomerAuditContext,
	) {
		const execute = async (tx: TenantPrismaClient) => {
			const category = await tx.customerCategory.findUnique({
				where: { id: input.categoryId },
			});
			if (!category) {
				throw new Error(`分类 [${input.categoryId}] 不存在`);
			}

			let customerTagsStr = "";
			if (input.tagIds && input.tagIds.length > 0) {
				const tags = await tx.customerTag.findMany({
					where: { id: { in: input.tagIds } },
					select: { name: true },
				});
				customerTagsStr = tags.map((t) => t.name).join(",");
			}

			return tx.customer.create({
				data: {
					name: input.name,
					categoryId: input.categoryId,
					contactPerson: input.contactPerson,
					contactPhone: input.contactPhone,
					settlementMethod: input.settlementMethod,
					defaultTaxRate:
						input.defaultTaxRate === undefined ? null : input.defaultTaxRate,
					creditLimit:
						input.creditLimit === undefined ? null : input.creditLimit,
					customerTags: customerTagsStr || null,
					salesPerson: input.salesPerson || null,
					defaultWarehouse: input.defaultWarehouse || null,
					paymentCycle: input.paymentCycle || null,
					serviceTime: input.serviceTime || null,
					status: "ACTIVE",
					createdById: auditCtx.userId,
					updatedById: auditCtx.userId,
					deptId: auditCtx.deptId ?? null,
					isDeleted: false,
					tagAssignments: input.tagIds?.length
						? {
								create: input.tagIds.map((tagId) => ({
									tag: { connect: { id: tagId } },
								})),
							}
						: undefined,
				},
				include: {
					category: true,
					tagAssignments: {
						include: {
							tag: true,
						},
					},
				},
			});
		};

		if ("$transaction" in client && typeof client.$transaction === "function") {
			return await client.$transaction((tx) =>
				execute(tx as TenantPrismaClient),
			);
		}
		return await execute(client);
	}

	/**
	 * 更新客户档案
	 */
	static async updateCustomer(
		client: TenantPrismaClient,
		id: string,
		input: UpdateCustomerInput,
		auditCtx?: { userId: string },
	) {
		const existing = await client.customer.findUnique({
			where: { id },
		});
		if (!existing || existing.isDeleted) {
			throw new Error(`客户 [${id}] 不存在`);
		}

		// 若需要更新标签
		if (input.tagIds !== undefined) {
			await client.customerTagAssignment.deleteMany({
				where: { customerId: id },
			});
			if (input.tagIds.length > 0) {
				await client.customerTagAssignment.createMany({
					data: input.tagIds.map((tagId) => ({
						customerId: id,
						tagId,
					})),
				});
			}
		}

		let customerTagsStr: string | undefined;
		if (input.tagIds !== undefined) {
			if (input.tagIds.length > 0) {
				const tags = await client.customerTag.findMany({
					where: { id: { in: input.tagIds } },
					select: { name: true },
				});
				customerTagsStr = tags.map((t) => t.name).join(",");
			} else {
				customerTagsStr = "";
			}
		}

		return client.customer.update({
			where: { id },
			data: {
				name: input.name,
				categoryId: input.categoryId,
				contactPerson: input.contactPerson,
				contactPhone: input.contactPhone,
				settlementMethod: input.settlementMethod,
				defaultTaxRate: input.defaultTaxRate,
				creditLimit: input.creditLimit,
				customerTags: customerTagsStr,
				salesPerson: input.salesPerson,
				defaultWarehouse: input.defaultWarehouse,
				paymentCycle: input.paymentCycle,
				serviceTime: input.serviceTime,
				status: input.status,
				updatedById: auditCtx?.userId ?? null,
			},
			include: {
				category: true,
				tagAssignments: {
					include: {
						tag: true,
					},
				},
			},
		});
	}

	/**
	 * 变更客户状态（核心业务红线：停用客户时下属门店同时停用）
	 */
	static async updateCustomerStatus(
		client: TenantPrismaClient,
		id: string,
		status: "ACTIVE" | "DISABLED",
		auditCtx?: { userId: string },
	) {
		return client.$transaction(async (tx) => {
			const updated = await tx.customer.update({
				where: { id },
				data: {
					status,
					updatedById: auditCtx?.userId ?? null,
				},
			});

			// 铁律：停用客户，下属所有门店强制同时停用
			if (status === MasterDataStatus.DISABLED) {
				await tx.customerStore.updateMany({
					where: { customerId: id },
					data: {
						status: MasterDataStatus.DISABLED,
						updatedById: auditCtx?.userId ?? null,
					},
				});
			}

			return updated;
		});
	}

	/**
	 * 软删除客户（核心控制点：已有活跃门店或单据的客户不允许删除，只能停用）
	 */
	static async deleteCustomer(
		client: TenantPrismaClient,
		id: string,
		auditCtx?: { userId: string },
	) {
		const storeCount = await client.customerStore.count({
			where: { customerId: id, isDeleted: false },
		});
		if (storeCount > 0) {
			throw new Error(
				`该客户下存在 ${storeCount} 家关联门店，禁止删除，请进行“停用”操作`,
			);
		}

		const quoteCount = await client.customerQuote.count({
			where: { customerId: id, isDeleted: false },
		});
		if (quoteCount > 0) {
			throw new Error(`该客户已存在关联报价单记录，禁止删除，请进行“停用”操作`);
		}

		// 执行软删除：标记 isDeleted 为 true，记录删除时间与删除人
		return client.customer.update({
			where: { id },
			data: {
				isDeleted: true,
				deletedAt: new Date(),
				deletedById: auditCtx?.userId ?? null,
			},
		});
	}
}
