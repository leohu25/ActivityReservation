import type { TenantPrismaClient, TenantPrisma } from "@base/db-tenant";
import { MasterDataStatus, resolvePagination } from "@base/shared";
import type {
	CreateDictItemInput,
	UpdateDictItemInput,
	TenantDictItemDto,
	TenantDictItemStatus,
	DictOption,
} from "./types";

export class TenantDictItemService {
	/**
	 * 分页查询字典项列表
	 */
	static async listDictItemsPaged(
		client: TenantPrismaClient,
		filter: {
			page?: number;
			pageSize?: number;
			keyword?: string;
			type?: string;
			status?: TenantDictItemStatus;
		} = {},
	): Promise<{
		items: TenantDictItemDto[];
		total: number;
		page: number;
		pageSize: number;
	}> {
		const { page, pageSize, skip, take } = resolvePagination(filter, {
			defaultPageSize: 20,
		});

		const where: TenantPrisma.TenantDictItemWhereInput = {};
		if (filter.type && filter.type.trim().length > 0) {
			where.type = filter.type.trim();
		}
		if (filter.status) {
			where.status = filter.status;
		}
		if (filter.keyword && filter.keyword.trim().length > 0) {
			const kw = filter.keyword.trim();
			where.OR = [
				{ name: { contains: kw, mode: "insensitive" } },
				{ code: { contains: kw, mode: "insensitive" } },
				{ type: { contains: kw, mode: "insensitive" } },
			];
		}

		const [total, items] = await Promise.all([
			client.tenantDictItem.count({ where }),
			client.tenantDictItem.findMany({
				where,
				orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
				skip,
				take,
			}),
		]);

		return {
			items: items.map((item) => ({
				id: item.id,
				type: item.type,
				code: item.code,
				name: item.name,
				status: item.status as TenantDictItemStatus,
				sort: item.sort,
				isDefault: item.isDefault,
				remark: item.remark,
				createdAt: item.createdAt.toISOString(),
				updatedAt: item.updatedAt.toISOString(),
			})),
			total,
			page,
			pageSize,
		};
	}

	/**
	 * 按字典类型获取精简下拉选项列表（供各业务切片调用）
	 */
	static async getDictOptionsByType(
		client: TenantPrismaClient,
		type: string,
		options: { onlyActive?: boolean } = { onlyActive: true },
	): Promise<DictOption[]> {
		const where: TenantPrisma.TenantDictItemWhereInput = {
			type: type.trim(),
		};
		if (options.onlyActive) {
			where.status = MasterDataStatus.ACTIVE;
		}

		const items = await client.tenantDictItem.findMany({
			where,
			orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
			select: {
				code: true,
				name: true,
				isDefault: true,
				sort: true,
			},
		});

		return items.map((item) => ({
			label: item.name,
			value: item.code,
			isDefault: item.isDefault,
			sort: item.sort,
		}));
	}

	/**
	 * 新增字典项（防同一 type 下 code 重复）
	 */
	static async createDictItem(
		client: TenantPrismaClient,
		input: CreateDictItemInput,
	): Promise<TenantDictItemDto> {
		const type = input.type.trim();
		const code = input.code.trim();

		// 检查同类型下是否已存在该编码
		const existing = await client.tenantDictItem.findUnique({
			where: {
				type_code: {
					type,
					code,
				},
			},
		});

		if (existing) {
			throw new Error(`字典类型 [${type}] 下已存在编码为 [${code}] 的字典项`);
		}

		// 若设为默认项，自动清除同类型下的其他默认项
		if (input.isDefault) {
			await client.tenantDictItem.updateMany({
				where: { type, isDefault: true },
				data: { isDefault: false },
			});
		}

		const created = await client.tenantDictItem.create({
			data: {
				type,
				code,
				name: input.name.trim(),
				status: input.status ?? MasterDataStatus.ACTIVE,
				sort: input.sort ?? 0,
				isDefault: input.isDefault ?? false,
				remark: input.remark ? input.remark.trim() : null,
			},
		});

		return {
			id: created.id,
			type: created.type,
			code: created.code,
			name: created.name,
			status: created.status as TenantDictItemStatus,
			sort: created.sort,
			isDefault: created.isDefault,
			remark: created.remark,
			createdAt: created.createdAt.toISOString(),
			updatedAt: created.updatedAt.toISOString(),
		};
	}

	/**
	 * 修改字典项
	 */
	static async updateDictItem(
		client: TenantPrismaClient,
		input: UpdateDictItemInput,
	): Promise<TenantDictItemDto> {
		const existing = await client.tenantDictItem.findUnique({
			where: { id: input.id },
		});
		if (!existing) {
			throw new Error("字典项不存在或已被删除");
		}

		// 若设为默认项，自动清除同类型下的其他默认项
		if (input.isDefault && !existing.isDefault) {
			await client.tenantDictItem.updateMany({
				where: { type: existing.type, isDefault: true },
				data: { isDefault: false },
			});
		}

		const data: TenantPrisma.TenantDictItemUpdateInput = {};
		if (input.name !== undefined) {
			data.name = input.name.trim();
		}
		if (input.status !== undefined) {
			data.status = input.status;
		}
		if (input.sort !== undefined) {
			data.sort = input.sort;
		}
		if (input.isDefault !== undefined) {
			data.isDefault = input.isDefault;
		}
		if (input.remark !== undefined) {
			data.remark = input.remark ? input.remark.trim() : null;
		}

		const updated = await client.tenantDictItem.update({
			where: { id: input.id },
			data,
		});

		return {
			id: updated.id,
			type: updated.type,
			code: updated.code,
			name: updated.name,
			status: updated.status as TenantDictItemStatus,
			sort: updated.sort,
			isDefault: updated.isDefault,
			remark: updated.remark,
			createdAt: updated.createdAt.toISOString(),
			updatedAt: updated.updatedAt.toISOString(),
		};
	}

	/**
	 * 删除字典项
	 */
	static async deleteDictItem(
		client: TenantPrismaClient,
		id: string,
	): Promise<void> {
		const existing = await client.tenantDictItem.findUnique({
			where: { id },
		});
		if (!existing) {
			throw new Error("字典项不存在或已被删除");
		}
		await client.tenantDictItem.delete({
			where: { id },
		});
	}

	/**
	 * 启停用状态切换
	 */
	static async toggleStatus(
		client: TenantPrismaClient,
		id: string,
		status: TenantDictItemStatus,
	): Promise<void> {
		await client.tenantDictItem.update({
			where: { id },
			data: { status },
		});
	}
}
