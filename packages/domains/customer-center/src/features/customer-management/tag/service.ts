import type { TenantPrismaClient } from "@base/db-tenant";
import {
	MasterDataStatus,
	generateDateSerialCode,
	retryOnUniqueConflict,
} from "@base/shared";
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

type TagTxClient = Parameters<
	Parameters<TenantPrismaClient["$transaction"]>[0]
>[0];

/**
 * 客户业务标签领域服务
 */
export class CustomerTagService {
	/**
	 * 自动生成标签唯一编码: TAG_YYYYMMDD_XXXX
	 * 调用方必须持有 advisory lock 避免并发冲突
	 */
	static async generateTagCode(
		client:
			| TenantPrismaClient
			| TagTxClient
			| { customerTag: TenantPrismaClient["customerTag"] },
	): Promise<string> {
		const today = new Date();
		const yyyy = today.getFullYear();
		const mm = String(today.getMonth() + 1).padStart(2, "0");
		const dd = String(today.getDate()).padStart(2, "0");
		const prefix = `TAG_${yyyy}${mm}${dd}_`;

		const latest = await client.customerTag.findFirst({
			where: { tagCode: { startsWith: prefix } },
			orderBy: { tagCode: "desc" },
			select: { tagCode: true },
		});

		return generateDateSerialCode({
			prefix: "TAG",
			separator: "_",
			digits: 4,
			latestCode: latest?.tagCode,
			now: today,
		});
	}

	/**
	 * 分页查询标签列表（服务端分页：count + skip/take）
	 */
	static async listTagsPaged(
		client: TenantPrismaClient,
		filter: {
			page?: number;
			pageSize?: number;
			keyword?: string;
			tagType?: string;
			status?: CustomerTagStatus;
		} = {},
	): Promise<{
		items: CustomerTagItem[];
		total: number;
		page: number;
		pageSize: number;
	}> {
		const page = Math.max(1, filter.page ?? 1);
		const pageSize = Math.max(1, Math.min(100, filter.pageSize ?? 20));
		const skip = (page - 1) * pageSize;

		const where: any = {};
		if (filter.tagType) {
			where.tagType = filter.tagType;
		}
		if (filter.status) {
			where.status = filter.status;
		}
		if (filter.keyword && filter.keyword.trim().length > 0) {
			const kw = filter.keyword.trim();
			where.OR = [
				{ tagCode: { contains: kw, mode: "insensitive" } },
				{ tagName: { contains: kw, mode: "insensitive" } },
				{ description: { contains: kw, mode: "insensitive" } },
			];
		}

		const [total, items] = await Promise.all([
			client.customerTag.count({ where }),
			client.customerTag.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip,
				take: pageSize,
			}),
		]);

		return {
			items: items.map((t) => ({
				...t,
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
		filter?: { tagType?: string; status?: CustomerTagStatus },
	): Promise<CustomerTagItem[]> {
		const where: any = {};
		if (filter?.tagType) {
			where.tagType = filter.tagType;
		}
		if (filter?.status) {
			where.status = filter.status;
		}

		const list = await client.customerTag.findMany({
			where,
			orderBy: { createdAt: "desc" },
		});

		return list.map((t) => ({
			...t,
			status: t.status as CustomerTagStatus,
		}));
	}

	/**
	 * 创建标签（事务 + advisory lock 稳定发号 + p-retry 重试保护）
	 */
	static async createTag(
		client: TenantPrismaClient,
		input: CreateTagInput,
		_auditCtx?: TagAuditContext,
	) {
		return await retryOnUniqueConflict(
			async () => {
				const execute = async (tx: TagTxClient | TenantPrismaClient) => {
					if ("$executeRaw" in tx && typeof tx.$executeRaw === "function") {
						await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('customer_tag_code'))`;
					}

					const tagCode =
						input.tagCode && input.tagCode.trim().length > 0
							? input.tagCode.trim()
							: await CustomerTagService.generateTagCode(tx);

					return tx.customerTag.create({
						data: {
							tagCode,
							tagName: input.tagName,
							tagType: input.tagType,
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
	 * 更新标签
	 */
	static async updateTag(
		client: TenantPrismaClient,
		tagCode: string,
		input: UpdateTagInput,
		_auditCtx?: TagAuditContext,
	) {
		const existing = await client.customerTag.findUnique({
			where: { tagCode },
		});
		if (!existing) {
			throw new Error(`标签 [${tagCode}] 不存在`);
		}

		return client.customerTag.update({
			where: { tagCode },
			data: {
				...(input.tagName !== undefined && { tagName: input.tagName }),
				...(input.tagType !== undefined && { tagType: input.tagType }),
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
		tagCode: string,
		status: CustomerTagStatus,
		_auditCtx?: TagAuditContext,
	) {
		const existing = await client.customerTag.findUnique({
			where: { tagCode },
		});
		if (!existing) {
			throw new Error(`标签 [${tagCode}] 不存在`);
		}

		return client.customerTag.update({
			where: { tagCode },
			data: { status },
		});
	}

	/**
	 * 删除标签
	 */
	static async deleteTag(
		client: TenantPrismaClient,
		tagCode: string,
		_auditCtx?: TagAuditContext,
	) {
		if (client.customerTagAssignment) {
			const assignmentCount = await client.customerTagAssignment.count({
				where: { tagCode },
			});
			if (assignmentCount > 0) {
				throw new Error(
					`当前已被 ${assignmentCount} 个客户关联使用，无法直接删除`,
				);
			}
		}

		const existing = await client.customerTag.findUnique({
			where: { tagCode },
		});
		if (!existing) {
			throw new Error(`标签 [${tagCode}] 不存在`);
		}

		return client.customerTag.delete({
			where: { tagCode },
		});
	}
}
