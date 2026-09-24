import type { TenantPrisma, TenantPrismaClient } from "@base/db-tenant";
import type {
	ProcessingSpecificationInput,
	ProcessingSpecificationItem,
} from "./types";

export type TenantPrismaTx =
	| TenantPrismaClient
	| TenantPrisma.TransactionClient;

export class ProcessingSpecificationService {
	/**
	 * 获取指定工序下的全部有效工艺规格
	 */
	static async listByOperationId(
		client: TenantPrismaTx,
		operationId: string,
	): Promise<ProcessingSpecificationItem[]> {
		const records = await client.processingSpecification.findMany({
			where: {
				operationId,
				isDeleted: false,
			},
			orderBy: { createdAt: "asc" },
		});

		return records.map((r) => ({
			id: r.id,
			operationId: r.operationId,
			code: r.code,
			name: r.name,
			description: r.description,
			defaultYieldRate: r.defaultYieldRate ? Number(r.defaultYieldRate) : null,
			status: r.status,
			createdAt: r.createdAt.toISOString(),
			updatedAt: r.updatedAt.toISOString(),
		}));
	}

	/**
	 * 同步工序下的所有工艺规格（在外部已有事务中执行）
	 * - 校验同工序内编码唯一性
	 * - 增量更新已存在规格
	 * - 插入全新规格
	 * - 软删除被移除的旧规格
	 */
	static async syncOperationSpecifications(
		tx: TenantPrismaTx,
		operationId: string,
		specifications: readonly ProcessingSpecificationInput[],
		context: { userId: string; deptId?: string | null },
	): Promise<void> {
		// 1. 内存中重名校验
		const codes = specifications.map((s) => s.code.trim().toUpperCase());
		const uniqueCodes = new Set(codes);
		if (uniqueCodes.size !== codes.length) {
			throw new Error("同一工序下的工艺规格编码不能重复");
		}

		// 2. 查询当前库中现有未删除规格
		const existing = await tx.processingSpecification.findMany({
			where: {
				operationId,
				isDeleted: false,
			},
			select: { id: true, code: true },
		});
		const existingMap = new Map(existing.map((e) => [e.id, e]));

		const retainedIds = new Set<string>();

		// 3. 处理传入的规格项
		for (const spec of specifications) {
			const yieldRateVal =
				spec.defaultYieldRate !== null && spec.defaultYieldRate !== undefined
					? spec.defaultYieldRate
					: null;

			if (spec.id && existingMap.has(spec.id)) {
				// 更新已存在的规格
				retainedIds.add(spec.id);
				await tx.processingSpecification.update({
					where: { id: spec.id },
					data: {
						code: spec.code.trim(),
						name: spec.name.trim(),
						description: spec.description ? spec.description.trim() : null,
						defaultYieldRate: yieldRateVal,
						status: spec.status || "ACTIVE",
						updatedById: context.userId,
					},
				});
			} else {
				// 新增规格
				// 先防重检查：同一个 operationId 下是否存在同 code 未删除记录
				const conflict = await tx.processingSpecification.findFirst({
					where: {
						operationId,
						code: spec.code.trim(),
						isDeleted: false,
					},
				});
				if (conflict) {
					throw new Error(
						`工艺规格编码「${spec.code.trim()}」在该工序下已存在`,
					);
				}

				await tx.processingSpecification.create({
					data: {
						operationId,
						code: spec.code.trim(),
						name: spec.name.trim(),
						description: spec.description ? spec.description.trim() : null,
						defaultYieldRate: yieldRateVal,
						status: spec.status || "ACTIVE",
						createdById: context.userId,
						deptId: context.deptId ?? null,
					},
				});
			}
		}

		// 4. 软删除在传入列表中被移除的旧规格
		const toDelete = existing.filter((e) => !retainedIds.has(e.id));
		if (toDelete.length > 0) {
			const toDeleteIds = toDelete.map((d) => d.id);
			// 检查是否被 BOM 使用
			const usedCount = await tx.bomVersionOperation.count({
				where: {
					processingSpecificationId: { in: toDeleteIds },
				},
			});
			if (usedCount > 0) {
				throw new Error(
					"部分被移除的工艺规格已被生产BOM工艺路线引用，无法删除。请将其状态修改为停用",
				);
			}

			await tx.processingSpecification.updateMany({
				where: { id: { in: toDeleteIds } },
				data: {
					isDeleted: true,
					deletedAt: new Date(),
					deletedById: context.userId,
				},
			});
		}
	}

	/**
	 * 软删除工序下所有的工艺规格（随工序级联软删除）
	 */
	static async softDeleteByOperationId(
		tx: TenantPrismaTx,
		operationId: string,
		context: { userId: string },
	): Promise<void> {
		await tx.processingSpecification.updateMany({
			where: {
				operationId,
				isDeleted: false,
			},
			data: {
				isDeleted: true,
				deletedAt: new Date(),
				deletedById: context.userId,
			},
		});
	}
}
