import { MasterDataStatus } from "@base/shared";
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

import { generateDateSerialCode, retryOnUniqueConflict } from "@base/shared";

type CustomerTxClient = Parameters<
	Parameters<TenantPrismaClient["$transaction"]>[0]
>[0];

export class CustomerService {
	/**
	 * 生成客户编码: CUST-YYYYMMDD-XXXX。
	 * 调用方必须在事务内先持有 advisory lock，避免并发读 max(code) 撞号。
	 * 禁止 count(*)+1。
	 */
	static async generateCustomerCode(
		client:
			| TenantPrismaClient
			| CustomerTxClient
			| { customer: TenantPrismaClient["customer"] },
	): Promise<string> {
		const today = new Date();
		const yyyy = today.getFullYear();
		const mm = String(today.getMonth() + 1).padStart(2, "0");
		const dd = String(today.getDate()).padStart(2, "0");
		const datePrefix = `CUST-${yyyy}${mm}${dd}-`;

		const latest = await client.customer.findFirst({
			where: {
				customerCode: {
					startsWith: datePrefix,
				},
			},
			orderBy: { customerCode: "desc" },
			select: { customerCode: true },
		});

		return generateDateSerialCode({
			prefix: "CUST",
			separator: "-",
			digits: 4,
			latestCode: latest?.customerCode,
			now: today,
		});
	}

	/**
	 * 查询客户列表（服务端分页：count + skip/take，禁止全量返回）
	 * 严格注入 accessibleWhere 数据范围过滤与 isDeleted: false 软删除物理过滤 (Fail-Closed)
	 */
	static async listCustomers(
		client: TenantPrismaClient,
		filter: ListCustomerFilter = {},
		accessibleWhere?: PrismaQueryCondition,
	): Promise<ListCustomersResult> {
		const page = Math.max(1, filter.page ?? 1);
		const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 20));
		const skip = (page - 1) * pageSize;

		const andConditions: TenantPrisma.CustomerWhereInput[] = [
			{ isDeleted: false },
		];

		if (accessibleWhere && Object.keys(accessibleWhere).length > 0) {
			andConditions.push(accessibleWhere as TenantPrisma.CustomerWhereInput);
		}

		if (filter.categoryCode) {
			andConditions.push({ categoryCode: filter.categoryCode });
		}
		if (filter.status) {
			andConditions.push({ status: filter.status });
		}
		if (filter.keyword) {
			const q = filter.keyword.trim().slice(0, 100);
			andConditions.push({
				OR: [
					{ customerCode: { contains: q, mode: "insensitive" } },
					{ customerName: { contains: q, mode: "insensitive" } },
					{ contactPerson: { contains: q, mode: "insensitive" } },
					{ contactPhone: { contains: q, mode: "insensitive" } },
				],
			});
		}
		if (filter.tagCode) {
			andConditions.push({
				tagAssignments: {
					some: {
						tagCode: filter.tagCode,
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
				take: pageSize,
			}),
		]);

		return { items, total, page, pageSize };
	}

	/**
	 * 获取客户详情（默认过滤软删除记录）
	 */
	static async getCustomer(client: TenantPrismaClient, customerCode: string) {
		const customer = await client.customer.findUnique({
			where: { customerCode },
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
	 * 创建客户档案：事务 + advisory lock 发号 + P2002 指数退避重试。
	 */
	static async createCustomer(
		client: TenantPrismaClient,
		input: CreateCustomerInput,
		auditCtx: CustomerAuditContext,
	) {
		return await retryOnUniqueConflict(
			async () => {
				return await client.$transaction(
					async (tx) => {
						// Postgres advisory lock：同事务提交时自动释放，兼容事务级连接池
						await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('customer_code'))`;

						const category = await tx.customerCategory.findUnique({
							where: { categoryCode: input.categoryCode },
						});
						if (!category) {
							throw new Error(`分类 [${input.categoryCode}] 不存在`);
						}

						const customerCode = await CustomerService.generateCustomerCode(tx);

						let customerTagsStr = "";
						if (input.tagCodes && input.tagCodes.length > 0) {
							const tags = await tx.customerTag.findMany({
								where: { tagCode: { in: input.tagCodes } },
								select: { tagName: true },
							});
							customerTagsStr = tags.map((t) => t.tagName).join(",");
						}

						return tx.customer.create({
							data: {
								customerCode,
								customerName: input.customerName,
								categoryCode: input.categoryCode,
								contactPerson: input.contactPerson,
								contactPhone: input.contactPhone,
								settlementMethod: input.settlementMethod,
								defaultTaxRate:
									input.defaultTaxRate === undefined
										? null
										: input.defaultTaxRate,
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
								tagAssignments: input.tagCodes?.length
									? {
											create: input.tagCodes.map((tagCode) => ({
												tag: { connect: { tagCode } },
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
					},
					{
						maxWait: 5000,
						timeout: 10000,
						isolationLevel: "ReadCommitted",
					},
				);
			},
			{ retries: 3 },
		);
	}

	/**
	 * 更新客户档案
	 */
	/**
	 * 更新客户档案
	 */
	static async updateCustomer(
		client: TenantPrismaClient,
		customerCode: string,
		input: UpdateCustomerInput,
		auditCtx?: { userId: string },
	) {
		const existing = await client.customer.findUnique({
			where: { customerCode },
		});
		if (!existing || existing.isDeleted) {
			throw new Error(`客户 [${customerCode}] 不存在`);
		}

		// 若需要更新标签
		if (input.tagCodes !== undefined) {
			await client.customerTagAssignment.deleteMany({
				where: { customerCode },
			});
			if (input.tagCodes.length > 0) {
				await client.customerTagAssignment.createMany({
					data: input.tagCodes.map((tagCode) => ({
						customerCode,
						tagCode,
					})),
				});
			}
		}

		let customerTagsStr: string | undefined;
		if (input.tagCodes !== undefined) {
			if (input.tagCodes.length > 0) {
				const tags = await client.customerTag.findMany({
					where: { tagCode: { in: input.tagCodes } },
					select: { tagName: true },
				});
				customerTagsStr = tags.map((t) => t.tagName).join(",");
			} else {
				customerTagsStr = "";
			}
		}

		return client.customer.update({
			where: { customerCode },
			data: {
				customerName: input.customerName,
				categoryCode: input.categoryCode,
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
		customerCode: string,
		status: "ACTIVE" | "DISABLED",
		auditCtx?: { userId: string },
	) {
		return client.$transaction(async (tx) => {
			const updated = await tx.customer.update({
				where: { customerCode },
				data: {
					status,
					updatedById: auditCtx?.userId ?? null,
				},
			});

			// 铁律：停用客户，下属所有门店强制同时停用
			if (status === MasterDataStatus.DISABLED) {
				await tx.customerStore.updateMany({
					where: { customerCode },
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
		customerCode: string,
		auditCtx?: { userId: string },
	) {
		const storeCount = await client.customerStore.count({
			where: { customerCode, isDeleted: false },
		});
		if (storeCount > 0) {
			throw new Error(
				`该客户下存在 ${storeCount} 家关联门店，禁止删除，请进行“停用”操作`,
			);
		}

		const quoteCount = await client.customerQuote.count({
			where: { customerCode, isDeleted: false },
		});
		if (quoteCount > 0) {
			throw new Error(`该客户已存在关联报价单记录，禁止删除，请进行“停用”操作`);
		}

		// 执行软删除：标记 isDeleted 为 true，记录删除时间与删除人
		return client.customer.update({
			where: { customerCode },
			data: {
				isDeleted: true,
				deletedAt: new Date(),
				deletedById: auditCtx?.userId ?? null,
			},
		});
	}
}
