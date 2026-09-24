import type { TenantPrisma, TenantPrismaClient } from "@base/db-tenant";
import { resolvePagination } from "@base/shared";
import {
	ProcessingSpecificationService,
	type TenantPrismaTx,
} from "./specification/service";
import type {
	CreateOperationInput,
	ListOperationsFilter,
	OperationDetail,
	OperationFormOptions,
	OperationListItem,
	UpdateOperationInput,
} from "./types";

export class OperationService {
	/**
	 * 分页查询工序/工艺档案列表
	 */
	static async listPaged(
		client: TenantPrismaClient,
		filter: ListOperationsFilter = {},
		accessibleWhere: TenantPrisma.OperationWhereInput = {},
	): Promise<{
		items: OperationListItem[];
		total: number;
		page: number;
		pageSize: number;
	}> {
		const { skip, take, page, pageSize } = resolvePagination(filter);

		const where: TenantPrisma.OperationWhereInput = {
			AND: [
				accessibleWhere,
				{ isDeleted: false },
				filter.keyword
					? {
							OR: [
								{ code: { contains: filter.keyword, mode: "insensitive" } },
								{ name: { contains: filter.keyword, mode: "insensitive" } },
							],
						}
					: {},
				filter.categoryId
					? { operationCategoryDictItemId: filter.categoryId }
					: {},
				filter.status ? { status: filter.status } : {},
			],
		};

		const [records, total] = await Promise.all([
			client.operation.findMany({
				where,
				skip,
				take,
				orderBy: { createdAt: "desc" },
				include: {
					specifications: {
						where: { isDeleted: false },
						select: { id: true },
					},
				},
			}),
			client.operation.count({ where }),
		]);

		// 批量查询分类与单位名称
		const categoryIds = Array.from(
			new Set(records.map((r) => r.operationCategoryDictItemId)),
		);
		const unitIds = Array.from(
			new Set(
				records
					.map((r) => r.minimumBatchUnitId)
					.filter((id): id is string => Boolean(id)),
			),
		);

		const [categories, units] = await Promise.all([
			categoryIds.length > 0
				? client.tenantDictItem.findMany({
						where: { id: { in: categoryIds } },
						select: { id: true, name: true },
					})
				: [],
			unitIds.length > 0
				? client.unitOfMeasure.findMany({
						where: { id: { in: unitIds } },
						select: { id: true, name: true },
					})
				: [],
		]);

		const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
		const unitMap = new Map(units.map((u) => [u.id, u.name]));

		const items: OperationListItem[] = records.map((r) => ({
			id: r.id,
			code: r.code,
			name: r.name,
			operationCategoryDictItemId: r.operationCategoryDictItemId,
			categoryName:
				categoryMap.get(r.operationCategoryDictItemId) || "未分类",
			defaultSetupMinutes: r.defaultSetupMinutes,
			defaultCleanupMinutes: r.defaultCleanupMinutes,
			defaultYieldRate: r.defaultYieldRate ? Number(r.defaultYieldRate) : null,
			minimumOperatorCount: r.minimumOperatorCount,
			minimumBatchQuantity: r.minimumBatchQuantity
				? Number(r.minimumBatchQuantity)
				: null,
			minimumBatchUnitId: r.minimumBatchUnitId,
			minimumBatchUnitName: r.minimumBatchUnitId
				? unitMap.get(r.minimumBatchUnitId) || null
				: null,
			sopText: r.sopText,
			specificationsCount: r.specifications.length,
			status: r.status,
			createdAt: r.createdAt.toISOString(),
			updatedAt: r.updatedAt.toISOString(),
		}));

		return { items, total, page, pageSize };
	}

	/**
	 * 根据ID获取工序详情及其包含的工艺规格
	 */
	static async getById(
		client: TenantPrismaTx,
		id: string,
	): Promise<OperationDetail | null> {
		const record = await client.operation.findFirst({
			where: { id, isDeleted: false },
			include: {
				specifications: {
					where: { isDeleted: false },
					orderBy: { createdAt: "asc" },
				},
			},
		});

		if (!record) return null;

		const [category, unit] = await Promise.all([
			client.tenantDictItem.findUnique({
				where: { id: record.operationCategoryDictItemId },
				select: { name: true },
			}),
			record.minimumBatchUnitId
				? client.unitOfMeasure.findUnique({
						where: { id: record.minimumBatchUnitId },
						select: { name: true },
					})
				: Promise.resolve(null),
		]);

		return {
			id: record.id,
			code: record.code,
			name: record.name,
			operationCategoryDictItemId: record.operationCategoryDictItemId,
			categoryName: category?.name || "未分类",
			defaultSetupMinutes: record.defaultSetupMinutes,
			defaultCleanupMinutes: record.defaultCleanupMinutes,
			defaultYieldRate: record.defaultYieldRate
				? Number(record.defaultYieldRate)
				: null,
			minimumOperatorCount: record.minimumOperatorCount,
			minimumBatchQuantity: record.minimumBatchQuantity
				? Number(record.minimumBatchQuantity)
				: null,
			minimumBatchUnitId: record.minimumBatchUnitId,
			minimumBatchUnitName: unit?.name || null,
			sopText: record.sopText,
			status: record.status,
			createdAt: record.createdAt.toISOString(),
			updatedAt: record.updatedAt.toISOString(),
			specifications: record.specifications.map((s) => ({
				id: s.id,
				operationId: s.operationId,
				code: s.code,
				name: s.name,
				description: s.description,
				defaultYieldRate: s.defaultYieldRate
					? Number(s.defaultYieldRate)
					: null,
				status: s.status,
				createdAt: s.createdAt.toISOString(),
				updatedAt: s.updatedAt.toISOString(),
			})),
		};
	}

	/**
	 * 新建工序及工艺规格明细
	 */
	static async create(
		client: TenantPrismaClient,
		input: CreateOperationInput,
		context: { userId: string; deptId?: string | null },
	): Promise<OperationDetail> {
		// 1. 唯一性校验
		const existing = await client.operation.findFirst({
			where: { code: input.code.trim(), isDeleted: false },
		});
		if (existing) {
			throw new Error(`工序编码「${input.code.trim()}」已存在`);
		}

		// 2. 事务中创建主档与子规格
		return await client.$transaction(async (tx) => {
			const created = await tx.operation.create({
				data: {
					code: input.code.trim(),
					name: input.name.trim(),
					operationCategoryDictItemId: input.operationCategoryDictItemId,
					defaultSetupMinutes: input.defaultSetupMinutes ?? 0,
					defaultCleanupMinutes: input.defaultCleanupMinutes ?? 0,
					defaultYieldRate: input.defaultYieldRate ?? null,
					minimumOperatorCount: input.minimumOperatorCount ?? null,
					minimumBatchQuantity: input.minimumBatchQuantity ?? null,
					minimumBatchUnitId: input.minimumBatchUnitId ?? null,
					sopText: input.sopText?.trim() || null,
					status: input.status || "ACTIVE",
					createdById: context.userId,
					deptId: context.deptId ?? null,
				},
			});

			if (input.specifications && input.specifications.length > 0) {
				await ProcessingSpecificationService.syncOperationSpecifications(
					tx,
					created.id,
					input.specifications,
					context,
				);
			}

			const detail = await OperationService.getById(tx, created.id);
			if (!detail) {
				throw new Error("创建工序后获取详情失败");
			}
			return detail;
		});
	}

	/**
	 * 更新工序主档及工艺规格明细
	 */
	static async update(
		client: TenantPrismaClient,
		id: string,
		input: UpdateOperationInput,
		context: { userId: string; deptId?: string | null },
	): Promise<OperationDetail> {
		const target = await client.operation.findFirst({
			where: { id, isDeleted: false },
		});
		if (!target) {
			throw new Error("未找到指定的工序或该工序已被删除");
		}

		if (input.code && input.code.trim() !== target.code) {
			const conflict = await client.operation.findFirst({
				where: { code: input.code.trim(), isDeleted: false },
			});
			if (conflict) {
				throw new Error(`工序编码「${input.code.trim()}」已被其他工序占用`);
			}
		}

		return await client.$transaction(async (tx) => {
			await tx.operation.update({
				where: { id },
				data: {
					code: input.code?.trim(),
					name: input.name?.trim(),
					operationCategoryDictItemId: input.operationCategoryDictItemId,
					defaultSetupMinutes: input.defaultSetupMinutes,
					defaultCleanupMinutes: input.defaultCleanupMinutes,
					defaultYieldRate: input.defaultYieldRate,
					minimumOperatorCount: input.minimumOperatorCount,
					minimumBatchQuantity: input.minimumBatchQuantity,
					minimumBatchUnitId: input.minimumBatchUnitId,
					sopText:
						input.sopText === undefined ? undefined : input.sopText?.trim() || null,
					status: input.status,
					updatedById: context.userId,
				},
			});

			if (input.specifications) {
				await ProcessingSpecificationService.syncOperationSpecifications(
					tx,
					id,
					input.specifications,
					context,
				);
			}

			const detail = await OperationService.getById(tx, id);
			if (!detail) {
				throw new Error("更新工序后获取详情失败");
			}
			return detail;
		});
	}

	/**
	 * 软删除工序及其工艺规格
	 */
	static async delete(
		client: TenantPrismaClient,
		id: string,
		context: { userId: string },
	): Promise<void> {
		const target = await client.operation.findFirst({
			where: { id, isDeleted: false },
		});
		if (!target) {
			throw new Error("未找到指定的工序或已被删除");
		}

		// 检查是否有生产BOM正在使用此工序
		const bomCount = await client.bomVersionOperation.count({
			where: { operationId: id },
		});
		if (bomCount > 0) {
			throw new Error("该工序已被生产BOM工艺路线引用，无法删除。可选择停用工序");
		}

		// 检查是否有产线能力关联
		const lineCount = await client.productionLineOperation.count({
			where: { operationId: id },
		});
		if (lineCount > 0) {
			throw new Error("该工序已被产线工序能力绑定，无法删除。可选择停用工序");
		}

		await client.$transaction(async (tx) => {
			// 1. 软删除工序主档
			await tx.operation.update({
				where: { id },
				data: {
					isDeleted: true,
					deletedAt: new Date(),
					deletedById: context.userId,
				},
			});

			// 2. 软删除下挂的所有工艺规格
			await ProcessingSpecificationService.softDeleteByOperationId(
				tx,
				id,
				context,
			);
		});
	}

	/**
	 * 启停用工序状态
	 */
	static async toggleStatus(
		client: TenantPrismaClient,
		id: string,
		status: "ACTIVE" | "DISABLED",
		context: { userId: string },
	): Promise<void> {
		const target = await client.operation.findFirst({
			where: { id, isDeleted: false },
		});
		if (!target) {
			throw new Error("未找到指定的工序");
		}

		await client.operation.update({
			where: { id },
			data: {
				status,
				updatedById: context.userId,
			},
		});
	}

	/**
	 * 获取表单所需的分类与单位选项
	 */
	static async getFormOptions(
		client: TenantPrismaClient,
	): Promise<OperationFormOptions> {
		const [categories, units] = await Promise.all([
			client.tenantDictItem.findMany({
				where: {
					type: "OPERATION_CATEGORY",
					isDeleted: false,
					status: "ACTIVE",
				},
				orderBy: { sort: "asc" },
				select: { id: true, name: true, code: true },
			}),
			client.unitOfMeasure.findMany({
				where: {
					isDeleted: false,
					status: "ACTIVE",
				},
				orderBy: { code: "asc" },
				select: { id: true, name: true, code: true },
			}),
		]);

		return {
			categories: categories.map((c) => ({
				id: c.id,
				name: c.name,
				code: c.code,
			})),
			units: units.map((u) => ({
				id: u.id,
				name: u.name,
				code: u.code,
			})),
		};
	}
}
