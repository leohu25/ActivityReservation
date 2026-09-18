import type { TenantPrismaClient } from "@base/db-tenant";
import {
	MasterDataStatus,
	generateDateSerialCode,
	retryOnUniqueConflict,
} from "@base/shared";
import type {
	CreateCategoryInput,
	UpdateCategoryInput,
	CustomerCategoryItem,
	CustomerCategoryStatus,
} from "./types";

export interface CategoryAuditContext {
	userId?: string;
	deptId?: string | null;
}

type CategoryTxClient = Parameters<
	Parameters<TenantPrismaClient["$transaction"]>[0]
>[0];

/**
 * 客户分类领域服务
 */
export class CustomerCategoryService {
	/**
	 * 自动生成分类唯一编码: CAT_YYYYMMDD_XXXX
	 * 调用方必须持有 advisory lock 避免并发冲突
	 */
	static async generateCategoryCode(
		client:
			| TenantPrismaClient
			| CategoryTxClient
			| { customerCategory: TenantPrismaClient["customerCategory"] },
	): Promise<string> {
		const today = new Date();
		const yyyy = today.getFullYear();
		const mm = String(today.getMonth() + 1).padStart(2, "0");
		const dd = String(today.getDate()).padStart(2, "0");
		const prefix = `CAT_${yyyy}${mm}${dd}_`;

		const latest = await client.customerCategory.findFirst({
			where: { categoryCode: { startsWith: prefix } },
			orderBy: { categoryCode: "desc" },
			select: { categoryCode: true },
		});

		return generateDateSerialCode({
			prefix: "CAT",
			separator: "_",
			digits: 4,
			latestCode: latest?.categoryCode,
			now: today,
		});
	}

	/**
	 * 分页查询分类列表（服务端分页：count + skip/take）
	 */
	static async listCategoriesPaged(
		client: TenantPrismaClient,
		filter: {
			page?: number;
			pageSize?: number;
			keyword?: string;
			status?: CustomerCategoryStatus;
		} = {},
	): Promise<{
		items: CustomerCategoryItem[];
		total: number;
		page: number;
		pageSize: number;
	}> {
		const page = Math.max(1, filter.page ?? 1);
		const pageSize = Math.max(1, Math.min(100, filter.pageSize ?? 20));
		const skip = (page - 1) * pageSize;

		const where: any = {};
		if (filter.status) {
			where.status = filter.status;
		}
		if (filter.keyword && filter.keyword.trim().length > 0) {
			const kw = filter.keyword.trim();
			where.OR = [
				{ categoryCode: { contains: kw, mode: "insensitive" } },
				{ categoryName: { contains: kw, mode: "insensitive" } },
				{ description: { contains: kw, mode: "insensitive" } },
			];
		}

		const [total, items] = await Promise.all([
			client.customerCategory.count({ where }),
			client.customerCategory.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip,
				take: pageSize,
			}),
		]);

		return {
			items: items.map((c) => ({
				...c,
				status: c.status as CustomerCategoryStatus,
			})),
			total,
			page,
			pageSize,
		};
	}

	/**
	 * 内部纯列表查询（用于 options 和全量数据）
	 */
	static async listCategories(
		client: TenantPrismaClient,
		filter?: { status?: CustomerCategoryStatus },
	): Promise<CustomerCategoryItem[]> {
		const where: any = {};
		if (filter?.status) {
			where.status = filter.status;
		}

		const list = await client.customerCategory.findMany({
			where,
			orderBy: { createdAt: "desc" },
		});

		return list.map((c) => ({
			...c,
			status: c.status as CustomerCategoryStatus,
		}));
	}

	/**
	 * 查询分类树形结构
	 */
	static async getCategoryTree(
		client: TenantPrismaClient,
	): Promise<CustomerCategoryItem[]> {
		const list = await CustomerCategoryService.listCategories(client);

		const map = new Map<string, CustomerCategoryItem>();
		for (const item of list) {
			map.set(item.categoryCode, {
				categoryCode: item.categoryCode,
				categoryName: item.categoryName,
				parentCode: item.parentCode ?? null,
				description: item.description ?? null,
				status: item.status ?? MasterDataStatus.ACTIVE,
				children: [],
			});
		}

		const tree: CustomerCategoryItem[] = [];
		for (const item of list) {
			const node = map.get(item.categoryCode)!;
			if (item.parentCode && map.has(item.parentCode)) {
				map.get(item.parentCode)!.children!.push(node);
			} else {
				tree.push(node);
			}
		}

		return tree;
	}

	/**
	 * 创建分类（事务 + advisory lock + p-retry 重试保护）
	 */
	static async createCategory(
		client: TenantPrismaClient,
		input: CreateCategoryInput,
		_auditCtx?: CategoryAuditContext,
	) {
		return await retryOnUniqueConflict(
			async () => {
				const execute = async (tx: CategoryTxClient | TenantPrismaClient) => {
					if ("$executeRaw" in tx && typeof tx.$executeRaw === "function") {
						await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('customer_category_code'))`;
					}

					if (input.parentCode) {
						const parent = await tx.customerCategory.findUnique({
							where: { categoryCode: input.parentCode },
						});
						if (!parent) {
							throw new Error(`指定的父级分类 [${input.parentCode}] 不存在`);
						}
					}

					const categoryCode =
						input.categoryCode && input.categoryCode.trim().length > 0
							? input.categoryCode.trim()
							: await CustomerCategoryService.generateCategoryCode(tx);

					return tx.customerCategory.create({
						data: {
							categoryCode,
							categoryName: input.categoryName,
							parentCode: input.parentCode || null,
							description: input.description,
							status: MasterDataStatus.ACTIVE,
						},
					});
				};

				if (
					"$transaction" in client &&
					typeof client.$transaction === "function"
				) {
					return await client.$transaction((tx) => execute(tx));
				}
				return await execute(client);
			},
			{ retries: 3 },
		);
	}

	/**
	 * 更新分类
	 */
	static async updateCategory(
		client: TenantPrismaClient,
		categoryCode: string,
		input: UpdateCategoryInput,
		_auditCtx?: CategoryAuditContext,
	) {
		const existing = await client.customerCategory.findUnique({
			where: { categoryCode },
		});
		if (!existing) {
			throw new Error(`分类 [${categoryCode}] 不存在`);
		}

		if (input.parentCode) {
			if (input.parentCode === categoryCode) {
				throw new Error("父级分类不能选择自身");
			}
			const parent = await client.customerCategory.findUnique({
				where: { categoryCode: input.parentCode },
			});
			if (!parent) {
				throw new Error(`指定的父级分类 [${input.parentCode}] 不存在`);
			}
		}

		return client.customerCategory.update({
			where: { categoryCode },
			data: {
				...(input.categoryName !== undefined && {
					categoryName: input.categoryName,
				}),
				...(input.parentCode !== undefined && {
					parentCode: input.parentCode || null,
				}),
				...(input.description !== undefined && {
					description: input.description,
				}),
			},
		});
	}

	/**
	 * 变更分类状态
	 */
	static async updateCategoryStatus(
		client: TenantPrismaClient,
		categoryCode: string,
		status: CustomerCategoryStatus,
		_auditCtx?: CategoryAuditContext,
	) {
		const existing = await client.customerCategory.findUnique({
			where: { categoryCode },
		});
		if (!existing) {
			throw new Error(`分类 [${categoryCode}] 不存在`);
		}

		return client.customerCategory.update({
			where: { categoryCode },
			data: { status },
		});
	}

	/**
	 * 删除分类（物理校验子分类与关联客户）
	 */
	static async deleteCategory(
		client: TenantPrismaClient,
		categoryCode: string,
		_auditCtx?: CategoryAuditContext,
	) {
		if (client.customerCategory?.count) {
			const childCount = await client.customerCategory.count({
				where: { parentCode: categoryCode },
			});
			if (childCount > 0) {
				throw new Error(
					`尚有 ${childCount} 个子级分类，请先处理子级分类后再删除`,
				);
			}
		}

		if (client.customer?.count) {
			const customerCount = await client.customer.count({
				where: { categoryCode, isDeleted: false },
			});
			if (customerCount > 0) {
				throw new Error(
					`该分类下仍有关联的有效客户档案 (${customerCount} 个)，禁止删除`,
				);
			}
		}

		if (client.customerCategory?.findUnique) {
			const existing = await client.customerCategory.findUnique({
				where: { categoryCode },
			});
			if (!existing) {
				throw new Error(`分类 [${categoryCode}] 不存在`);
			}
		}

		return client.customerCategory.delete({
			where: { categoryCode },
		});
	}
}
