import type { TenantPrismaClient, TenantPrisma } from "@base/db-tenant";
import { MasterDataStatus, resolvePagination } from "@base/shared";
import type {
	CreateTagInput,
	UpdateTagInput,
	CustomerTagItem,
	CustomerTagStatus,
} from "./types";

export interface TagAuditContext {
	userId?: string;
	deptId?: string | null;
}

/**
 * 客户业务标签领域服务
 */
export class CustomerTagService {
	/**
	 * 分页查询标签列表（服务端分页：count + skip/take）
	 */
	static async listTagsPaged(
		client: TenantPrismaClient,
		filter: {
			page?: number;
			pageSize?: number;
			keyword?: string;
			tagTypeId?: string;
			status?: CustomerTagStatus;
		} = {},
	): Promise<{
		items: CustomerTagItem[];
		total: number;
		page: number;
		pageSize: number;
	}> {
		const { page, pageSize, skip, take } = resolvePagination(filter, {
			defaultPageSize: 20,
		});

		const where: TenantPrisma.CustomerTagWhereInput = {};
		if (filter.tagTypeId) {
			where.tagTypeId = filter.tagTypeId;
		}
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
			client.customerTag.count({ where }),
			client.customerTag.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip,
				take,
			}),
		]);

		// 批量解析关联字典对象 (无 N+1，遵循 DTO 投影完备性)
		const dictIds = Array.from(
			new Set(
				items
					.map((t) => t.tagTypeId)
					.filter((id): id is string => Boolean(id)),
			),
		);
		const dictMap = new Map<
			string,
			{ id: string; code: string; name: string }
		>();
		if (dictIds.length > 0) {
			const dictItems = await client.tenantDictItem.findMany({
				where: { id: { in: dictIds } },
				select: { id: true, code: true, name: true },
			});
			for (const item of dictItems) {
				dictMap.set(item.id, item);
			}
		}

		return {
			items: items.map((t) => ({
				...t,
				tagType: t.tagTypeId ? (dictMap.get(t.tagTypeId) ?? null) : null,
				status: t.status as CustomerTagStatus,
			})),
			total,
			page,
			pageSize,
		};
	}

	/**
	 * 内部纯列表查询（用于 options 和全量数据）
	 */
	static async listTags(
		client: TenantPrismaClient,
		filter?: { tagTypeId?: string; status?: CustomerTagStatus },
	): Promise<CustomerTagItem[]> {
		const where: TenantPrisma.CustomerTagWhereInput = {};
		if (filter?.tagTypeId) {
			where.tagTypeId = filter.tagTypeId;
		}
		if (filter?.status) {
			where.status = filter.status;
		}

		const list = await client.customerTag.findMany({
			where,
			orderBy: { createdAt: "desc" },
		});

		const dictIds = Array.from(
			new Set(
				list
					.map((t) => t.tagTypeId)
					.filter((id): id is string => Boolean(id)),
			),
		);
		const dictMap = new Map<
			string,
			{ id: string; code: string; name: string }
		>();
		if (dictIds.length > 0) {
			const dictItems = await client.tenantDictItem.findMany({
				where: { id: { in: dictIds } },
				select: { id: true, code: true, name: true },
			});
			for (const item of dictItems) {
				dictMap.set(item.id, item);
			}
		}

		return list.map((t) => ({
			...t,
			tagType: t.tagTypeId ? (dictMap.get(t.tagTypeId) ?? null) : null,
			status: t.status as CustomerTagStatus,
		}));
	}

	/**
	 * 创建标签
	 */
	static async createTag(
		client: TenantPrismaClient,
		input: CreateTagInput,
		_auditCtx?: TagAuditContext,
	) {
		return client.customerTag.create({
			data: {
				name: input.name,
				tagTypeId: input.tagTypeId,
				description: input.description,
				status: MasterDataStatus.ACTIVE,
			},
		});
	}

	/**
	 * 更新标签
	 */
	static async updateTag(
		client: TenantPrismaClient,
		id: string,
		input: UpdateTagInput,
		_auditCtx?: TagAuditContext,
	) {
		const existing = await client.customerTag.findUnique({
			where: { id },
		});
		if (!existing) {
			throw new Error(`标签 [${id}] 不存在`);
		}

		return client.customerTag.update({
			where: { id },
			data: {
				...(input.name !== undefined && { name: input.name }),
				...(input.tagTypeId !== undefined && { tagTypeId: input.tagTypeId }),
				...(input.description !== undefined && {
					description: input.description,
				}),
			},
		});
	}

	/**
	 * 变更标签状态
	 */
	static async updateTagStatus(
		client: TenantPrismaClient,
		id: string,
		status: CustomerTagStatus,
		_auditCtx?: TagAuditContext,
	) {
		const existing = await client.customerTag.findUnique({
			where: { id },
		});
		if (!existing) {
			throw new Error(`标签 [${id}] 不存在`);
		}

		return client.customerTag.update({
			where: { id },
			data: { status },
		});
	}

	/**
	 * 删除标签
	 */
	static async deleteTag(
		client: TenantPrismaClient,
		id: string,
		_auditCtx?: TagAuditContext,
	) {
		if (client.customerTagAssignment) {
			const assignmentCount = await client.customerTagAssignment.count({
				where: { tagId: id },
			});
			if (assignmentCount > 0) {
				throw new Error(
					`当前已被 ${assignmentCount} 个客户关联使用，无法直接删除`,
				);
			}
		}

		const existing = await client.customerTag.findUnique({
			where: { id },
		});
		if (!existing) {
			throw new Error(`标签 [${id}] 不存在`);
		}

		return client.customerTag.delete({
			where: { id },
		});
	}
}
