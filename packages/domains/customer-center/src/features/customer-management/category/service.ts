import type { TenantPrismaClient } from "@base/db-tenant";
import { MasterDataStatus } from "@base/shared";
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

/**
 * 客户分类领域服务
 */
export class CustomerCategoryService {
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
				{ name: { contains: kw, mode: "insensitive" } },
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
			map.set(item.id, {
				id: item.id,
				name: item.name,
				parentId: item.parentId ?? null,
				description: item.description ?? null,
				status: item.status ?? MasterDataStatus.ACTIVE,
				children: [],
			});
		}

		const tree: CustomerCategoryItem[] = [];
		for (const item of list) {
			const node = map.get(item.id)!;
			if (item.parentId && map.has(item.parentId)) {
				map.get(item.parentId)!.children!.push(node);
			} else {
				tree.push(node);
			}
		}

		return tree;
	}

	/**
	 * 创建分类
	 */
	static async createCategory(
		client: TenantPrismaClient,
		input: CreateCategoryInput,
		_auditCtx?: CategoryAuditContext,
	) {
		if (input.parentId) {
			const parent = await client.customerCategory.findUnique({
				where: { id: input.parentId },
			});
			if (!parent) {
				throw new Error(`指定的父级分类 [${input.parentId}] 不存在`);
			}
		}

		return client.customerCategory.create({
			data: {
				name: input.name,
				parentId: input.parentId || null,
				description: input.description,
				status: MasterDataStatus.ACTIVE,
			},
		});
	}

	/**
	 * 更新分类
	 */
	static async updateCategory(
		client: TenantPrismaClient,
		id: string,
		input: UpdateCategoryInput,
		_auditCtx?: CategoryAuditContext,
	) {
		const existing = await client.customerCategory.findUnique({
			where: { id },
		});
		if (!existing) {
			throw new Error(`分类 [${id}] 不存在`);
		}

		if (input.parentId) {
			if (input.parentId === id) {
				throw new Error("父级分类不能选择自身");
			}
			const parent = await client.customerCategory.findUnique({
				where: { id: input.parentId },
			});
			if (!parent) {
				throw new Error(`指定的父级分类 [${input.parentId}] 不存在`);
			}
		}

		return client.customerCategory.update({
			where: { id },
			data: {
				...(input.name !== undefined && {
					name: input.name,
				}),
				...(input.parentId !== undefined && {
					parentId: input.parentId || null,
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
		id: string,
		status: CustomerCategoryStatus,
		_auditCtx?: CategoryAuditContext,
	) {
		const existing = await client.customerCategory.findUnique({
			where: { id },
		});
		if (!existing) {
			throw new Error(`分类 [${id}] 不存在`);
		}

		return client.customerCategory.update({
			where: { id },
			data: { status },
		});
	}

	/**
	 * 删除分类（物理校验子分类与关联客户）
	 */
	static async deleteCategory(
		client: TenantPrismaClient,
		id: string,
		_auditCtx?: CategoryAuditContext,
	) {
		if (client.customerCategory?.count) {
			const childCount = await client.customerCategory.count({
				where: { parentId: id },
			});
			if (childCount > 0) {
				throw new Error(
					`尚有 ${childCount} 个子级分类，请先处理子级分类后再删除`,
				);
			}
		}

		if (client.customer?.count) {
			const customerCount = await client.customer.count({
				where: { categoryId: id, isDeleted: false },
			});
			if (customerCount > 0) {
				throw new Error(
					`该分类下仍有关联的有效客户档案 (${customerCount} 个)，禁止删除`,
				);
			}
		}

		if (client.customerCategory?.findUnique) {
			const existing = await client.customerCategory.findUnique({
				where: { id },
			});
			if (!existing) {
				throw new Error(`分类 [${id}] 不存在`);
			}
		}

		return client.customerCategory.delete({
			where: { id },
		});
	}
}
