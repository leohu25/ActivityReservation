import type { TenantPrismaClient, TenantPrisma } from "@base/db-tenant";
import { resolvePagination } from "@base/shared";
import {
	BOM_TYPES,
	BOM_VERSION_STATUS,
	OUTPUT_ROLES,
	QUANTITY_MODES,
	MATERIAL_ROLES,
	SUPPLY_POLICIES,
	type BomType,
	type BomVersionStatus,
	type MaterialRole,
	type SupplyPolicy,
	type OutputRole,
	type QuantityMode,
} from "./contract";
import type {
	BomDetailDto,
	BomFormOptions,
	BomInputItemDto,
	BomListItemDto,
	BomOperationItemDto,
	BomOutputItemDto,
	CreateBomInput,
	ListBomFilter,
	ListBomsResult,
	UpdateBomInput,
} from "./types";

export interface BomAuditContext {
	readonly userId: string;
	readonly deptId?: string | null;
}

export class BomService {
	/**
	 * 分页查询 BOM 列表 (接收 CASL 授权下推条件 accessibleWhere 进行 SQL 行级过滤)
	 */
	static async listBomsPaged(
		client: TenantPrismaClient,
		filter: ListBomFilter = {},
		accessibleWhere: TenantPrisma.BomWhereInput = {},
	): Promise<ListBomsResult> {
		const { page, pageSize, skip, take } = resolvePagination(filter, {
			defaultPageSize: 10,
		});

		// 查询没有软删除且符合 CASL 行级权限过滤的 BOM 版本族
		const boms = await client.bom.findMany({
			where: {
				AND: [
					accessibleWhere,
					{ isDeleted: false },
				],
			},
			include: {
				versions: {
					where: { isDeleted: false },
					orderBy: { versionNumber: "desc" },
					include: {
						outputs: {
							where: { isDeleted: false },
							orderBy: { sortOrder: "asc" },
						},
						operations: {
							where: { isDeleted: false },
							orderBy: { sequenceNumber: "asc" },
						},
					},
				},
				defaultBoms: {
					where: { isDeleted: false },
				},
			},
			orderBy: { createdAt: "desc" },
		});

		// 收集所有关联的外部实体 ID，批量加载关联数据
		const productIds = new Set<string>();
		const lineIds = new Set<string>();
		const operationIds = new Set<string>();

		for (const b of boms) {
			for (const v of b.versions) {
				if (v.productionLineId) lineIds.add(v.productionLineId);
				for (const o of v.outputs) productIds.add(o.productId);
				for (const op of v.operations) operationIds.add(op.operationId);
			}
		}

		const [products, lines, operations] = await Promise.all([
			client.product.findMany({
				where: { id: { in: Array.from(productIds) } },
				include: { category: true, inventoryUnit: true },
			}),
			client.productionLine.findMany({
				where: { id: { in: Array.from(lineIds) } },
				select: { id: true, code: true, name: true },
			}),
			client.operation.findMany({
				where: { id: { in: Array.from(operationIds) } },
				select: { id: true, code: true, name: true },
			}),
		]);

		const productMap = new Map(products.map((p) => [p.id, p]));
		const lineMap = new Map(lines.map((l) => [l.id, l]));
		const operationMap = new Map(operations.map((op) => [op.id, op]));

		// 装配 DTO 列表
		let allItems: BomListItemDto[] = [];

		for (const b of boms) {
			// 取当前发布版本，若无则取最新版本
			const activeVersion =
				b.versions.find((v) => v.id === b.currentPublishedVersionId) ??
				b.versions[0];
			if (!activeVersion) continue;

			// 主产出商品 (output_role === 'PRIMARY')
			const primaryOutput =
				activeVersion.outputs.find((o) => o.outputRole === OUTPUT_ROLES.PRIMARY) ??
				activeVersion.outputs[0];

			const prod = primaryOutput ? productMap.get(primaryOutput.productId) : null;
			const line = activeVersion.productionLineId
				? lineMap.get(activeVersion.productionLineId)
				: null;

			const opLabels = activeVersion.operations
				.map((op) => operationMap.get(op.operationId)?.name)
				.filter((n): n is string => Boolean(n));

			const isDefault = b.defaultBoms.some((d) => !d.isDeleted);

			const bomTypeLabel =
				activeVersion.bomType === BOM_TYPES.PROCESSING
					? "单品"
					: activeVersion.bomType === BOM_TYPES.FORMULA
						? "组合"
						: "包装";

			allItems.push({
				id: b.id,
				versionId: activeVersion.id,
				code: activeVersion.code,
				name: activeVersion.name,
				bomType: activeVersion.bomType as BomType,
				bomTypeLabel,
				productionLineId: activeVersion.productionLineId,
				productionLineName: line?.name ?? null,
				productId: prod?.id ?? primaryOutput?.productId ?? "",
				productName: prod?.name ?? "未知商品",
				productCode: prod?.code ?? "-",
				productCategoryName: prod?.category?.name ?? null,
				isDefault,
				versionNumber: activeVersion.versionNumber,
				versionStatus: activeVersion.versionStatus as BomVersionStatus,
				operations: opLabels,
				createdAt: b.createdAt.toISOString(),
				updatedAt: b.updatedAt.toISOString(),
			});
		}

		// 内存级精确过滤（支持按 Tab 类型、商品分类与关键字筛选）
		if (filter.bomType && filter.bomType !== "ALL") {
			allItems = allItems.filter((i) => i.bomType === filter.bomType);
		}
		if (filter.categoryId) {
			const targetCat = products.find((p) => p.productCategoryId === filter.categoryId);
			if (targetCat) {
				allItems = allItems.filter(
					(i) => i.productCategoryName === targetCat.category?.name,
				);
			}
		}
		if (filter.keyword && filter.keyword.trim().length > 0) {
			const kw = filter.keyword.trim().toLowerCase();
			allItems = allItems.filter(
				(i) =>
					i.name.toLowerCase().includes(kw) ||
					i.code.toLowerCase().includes(kw) ||
					i.productName.toLowerCase().includes(kw) ||
					i.productCode.toLowerCase().includes(kw),
			);
		}

		const total = allItems.length;
		const pagedItems = allItems.slice(skip, skip + take);

		return {
			items: pagedItems,
			total,
			page,
			pageSize,
		};
	}

	/**
	 * 查询单个 BOM 详情与版本图谱数据
	 */
	static async getBomDetail(
		client: TenantPrismaClient,
		bomId: string,
		targetVersionNumber?: number,
	): Promise<BomDetailDto> {
		const bom = await client.bom.findUnique({
			where: { id: bomId },
			include: {
				versions: {
					where: { isDeleted: false },
					orderBy: { versionNumber: "desc" },
					include: {
						inputs: {
							where: { isDeleted: false },
							orderBy: { sortOrder: "asc" },
						},
						outputs: {
							where: { isDeleted: false },
							orderBy: { sortOrder: "asc" },
						},
						operations: {
							where: { isDeleted: false },
							orderBy: { sequenceNumber: "asc" },
						},
					},
				},
				defaultBoms: {
					where: { isDeleted: false },
				},
			},
		});

		if (!bom || bom.isDeleted) {
			throw new Error("BOM 方案不存在或已被删除");
		}

		const selectedVersion = targetVersionNumber
			? bom.versions.find((v) => v.versionNumber === targetVersionNumber)
			: bom.versions.find((v) => v.id === bom.currentPublishedVersionId) ??
				bom.versions[0];

		if (!selectedVersion) {
			throw new Error("找不到可用的 BOM 版本记录");
		}

		// 加载所有相关物料、单位、产线、工序详情
		const allProductIds = new Set<string>();
		const allUnitIds = new Set<string>();
		const allOperationIds = new Set<string>();
		const allLineIds = new Set<string>();
		const childBomIds = new Set<string>();
		const childVersionIds = new Set<string>();
		const specIds = new Set<string>();

		if (selectedVersion.productionLineId) {
			allLineIds.add(selectedVersion.productionLineId);
		}
		for (const i of selectedVersion.inputs) {
			allProductIds.add(i.productId);
			allUnitIds.add(i.unitId);
			if (i.childBomId) childBomIds.add(i.childBomId);
			if (i.childBomVersionId) childVersionIds.add(i.childBomVersionId);
		}
		for (const o of selectedVersion.outputs) {
			allProductIds.add(o.productId);
			allUnitIds.add(o.unitId);
		}
		for (const op of selectedVersion.operations) {
			allOperationIds.add(op.operationId);
			if (op.processingSpecificationId) specIds.add(op.processingSpecificationId);
		}

		const [products, units, lines, operations, childBoms, childVersions, specifications] = await Promise.all([
			client.product.findMany({
				where: { id: { in: Array.from(allProductIds) } },
				include: { category: true, inventoryUnit: true },
			}),
			client.unitOfMeasure.findMany({
				where: { id: { in: Array.from(allUnitIds) } },
			}),
			client.productionLine.findMany({
				where: { id: { in: Array.from(allLineIds) } },
			}),
			client.operation.findMany({
				where: { id: { in: Array.from(allOperationIds) } },
			}),
			childBomIds.size > 0
				? client.bom.findMany({
						where: { id: { in: Array.from(childBomIds) } },
						include: { currentPublishedVersion: true },
					})
				: [],
			childVersionIds.size > 0
				? client.bomVersion.findMany({
						where: { id: { in: Array.from(childVersionIds) } },
						select: { id: true, versionNumber: true, name: true, code: true },
					})
				: [],
			specIds.size > 0
				? client.processingSpecification.findMany({
						where: { id: { in: Array.from(specIds) } },
						select: { id: true, code: true, name: true, description: true },
					})
				: [],
		]);

		const productMap = new Map(products.map((p) => [p.id, p]));
		const unitMap = new Map(units.map((u) => [u.id, u]));
		const lineMap = new Map(lines.map((l) => [l.id, l]));
		const opMap = new Map(operations.map((o) => [o.id, o]));
		const childBomMap = new Map(childBoms.map((b) => [b.id, b]));
		const childVersionMap = new Map(childVersions.map((v) => [v.id, v]));
		const specMap = new Map(specifications.map((s) => [s.id, s]));

		const primaryOutput = selectedVersion.outputs.find(
			(o) => o.outputRole === OUTPUT_ROLES.PRIMARY,
		);
		const mainProd = primaryOutput ? productMap.get(primaryOutput.productId) : null;

		const inputs: BomInputItemDto[] = selectedVersion.inputs.map((inp) => {
			const p = productMap.get(inp.productId);
			const u = unitMap.get(inp.unitId);
			const childBom = inp.childBomId ? childBomMap.get(inp.childBomId) : null;
			const lockedVersion = inp.childBomVersionId
				? childVersionMap.get(inp.childBomVersionId)
				: null;
			return {
				id: inp.id,
				productId: inp.productId,
				productName: p?.name,
				productCode: p?.code,
				quantity: inp.quantity ? Number(inp.quantity) : null,
				unitId: inp.unitId,
				unitName: u?.name ?? u?.code,
				ratio: inp.ratio ? Number(inp.ratio) : null,
				materialRole: inp.materialRole as MaterialRole,
				cookedYieldRate: inp.cookedYieldRate ? Number(inp.cookedYieldRate) : null,
				normalLossRate: inp.normalLossRate ? Number(inp.normalLossRate) : null,
				supplyPolicy: inp.supplyPolicy as SupplyPolicy,
				childBomId: inp.childBomId,
				childBomName: childBom?.currentPublishedVersion?.name,
				childBomVersionId: inp.childBomVersionId,
				childBomVersionNumber: lockedVersion?.versionNumber ?? null,
				latestChildBomVersionId: childBom?.currentPublishedVersionId ?? null,
				latestChildBomVersionNumber:
					childBom?.currentPublishedVersion?.versionNumber ?? null,
				sortOrder: inp.sortOrder,
				remark: inp.remark,
			};
		});

		const outputs: BomOutputItemDto[] = selectedVersion.outputs.map((out) => {
			const p = productMap.get(out.productId);
			const u = unitMap.get(out.unitId);
			return {
				id: out.id,
				productId: out.productId,
				productName: p?.name,
				productCode: p?.code,
				quantity: Number(out.quantity),
				unitId: out.unitId,
				unitName: u?.name ?? u?.code,
				outputRole: out.outputRole as OutputRole,
				costAllocationRatio: out.costAllocationRatio
					? Number(out.costAllocationRatio)
					: null,
				sortOrder: out.sortOrder,
				remark: out.remark,
			};
		});

		const ops: BomOperationItemDto[] = selectedVersion.operations.map((op) => {
			const o = opMap.get(op.operationId);
			const spec = op.processingSpecificationId
				? specMap.get(op.processingSpecificationId)
				: null;
			return {
				id: op.id,
				operationId: op.operationId,
				operationName: o?.name,
				operationCode: o?.code,
				processingSpecificationId: op.processingSpecificationId,
				processingSpecificationName: spec?.name ?? null,
				sequenceNumber: op.sequenceNumber,
				setupMinutes: op.setupMinutes,
				cleanupMinutes: op.cleanupMinutes,
				standardLaborHours: op.standardLaborHours
					? Number(op.standardLaborHours)
					: null,
				qualityCheckpoint: op.qualityCheckpoint,
				instructionText: op.instructionText,
				instructionParameters: op.instructionParameters as Record<string, unknown> | null,
				sortOrder: op.sortOrder,
				remark: op.remark,
			};
		});

		return {
			id: bom.id,
			lifecycleStatus: bom.lifecycleStatus,
			isDefault: bom.defaultBoms.some((d) => !d.isDeleted),
			primaryProduct: {
				id: mainProd?.id ?? "",
				code: mainProd?.code ?? "-",
				name: mainProd?.name ?? "未知商品",
				categoryName: mainProd?.category?.name,
				unitName: mainProd?.inventoryUnit?.name,
			},
			currentVersion: {
				id: selectedVersion.id,
				bomId: bom.id,
				versionNumber: selectedVersion.versionNumber,
				versionStatus: selectedVersion.versionStatus as BomVersionStatus,
				code: selectedVersion.code,
				name: selectedVersion.name,
				bomType: selectedVersion.bomType as BomType,
				description: selectedVersion.description,
				productionLineId: selectedVersion.productionLineId,
				productionLineName: selectedVersion.productionLineId
					? lineMap.get(selectedVersion.productionLineId)?.name
					: null,
				quantityMode: selectedVersion.quantityMode as QuantityMode,
				totalYieldEnabled: selectedVersion.totalYieldEnabled,
				totalYieldRate: selectedVersion.totalYieldRate
					? Number(selectedVersion.totalYieldRate)
					: null,
				defaultCookedYieldRate: selectedVersion.defaultCookedYieldRate
					? Number(selectedVersion.defaultCookedYieldRate)
					: null,
				minimumBatchQuantity: selectedVersion.minimumBatchQuantity
					? Number(selectedVersion.minimumBatchQuantity)
					: null,
				inputs,
				outputs,
				operations: ops,
			},
			versionHistory: bom.versions.map((v) => ({
				id: v.id,
				versionNumber: v.versionNumber,
				versionStatus: v.versionStatus as BomVersionStatus,
				code: v.code,
				name: v.name,
				publishedAt: v.publishedAt?.toISOString(),
				changeReason: v.changeReason,
			})),
		};
	}

	/**
	 * 创建新生产 BOM
	 */
	static async createBom(
		client: TenantPrismaClient,
		input: CreateBomInput,
		audit: BomAuditContext,
	): Promise<{ bomId: string; versionId: string }> {
		// 校验目标商品是否存在
		const product = await client.product.findUnique({
			where: { id: input.productId },
			include: { inventoryUnit: true },
		});
		if (!product || product.isDeleted) {
			throw new Error("所选 BOM 主商品不存在或已被删除");
		}

		// 开启事务统一写入 BOM、版本与三大子表清单
		const result = await client.$transaction(async (tx) => {
			// 1. 创建 BOM 版本族
			const bom = await tx.bom.create({
				data: {
					lifecycleStatus: "ACTIVE",
					createdById: audit.userId,
					deptId: audit.deptId ?? null,
				},
			});

			// 2. 创建第一版 BOM Version (根据 isDraft 决定为 DRAFT 或 PUBLISHED)
			const isDraft = Boolean(input.isDraft);
			const versionStatus = isDraft
				? BOM_VERSION_STATUS.DRAFT
				: BOM_VERSION_STATUS.PUBLISHED;

			const version = await tx.bomVersion.create({
				data: {
					bomId: bom.id,
					versionNumber: 1,
					versionStatus,
					code: input.code.trim(),
					name: input.name.trim(),
					bomType: input.bomType,
					description: input.description?.trim() || null,
					productionLineId: input.productionLineId || null,
					quantityMode: input.quantityMode ?? QUANTITY_MODES.FIXED,
					totalYieldEnabled: input.totalYieldEnabled ?? false,
					totalYieldRate: input.totalYieldRate ?? null,
					defaultCookedYieldRate: input.defaultCookedYieldRate ?? null,
					minimumBatchQuantity: input.minimumBatchQuantity ?? null,
					publishedById: isDraft ? null : audit.userId,
					publishedAt: isDraft ? null : new Date(),
					createdById: audit.userId,
					deptId: audit.deptId ?? null,
				},
			});

			// 3. 若为正式发布，将 BOM 族的当前版本指向该初始版本
			if (!isDraft) {
				await tx.bom.update({
					where: { id: bom.id },
					data: { currentPublishedVersionId: version.id },
				});
			}

			// 4. 写入产出清单 (保证 PRIMARY 唯一且指向 BOM 主商品)
			const outputsToInsert = [...(input.outputs || [])];
			const hasPrimary = outputsToInsert.some(
				(o) => o.outputRole === OUTPUT_ROLES.PRIMARY,
			);
			if (!hasPrimary) {
				outputsToInsert.unshift({
					productId: product.id,
					quantity: 1,
					unitId: product.inventoryUnitId,
					outputRole: OUTPUT_ROLES.PRIMARY,
					costAllocationRatio: null,
					sortOrder: 0,
					remark: "主产品",
				});
			}

			for (let idx = 0; idx < outputsToInsert.length; idx++) {
				const out = outputsToInsert[idx];
				await tx.bomVersionOutput.create({
					data: {
						bomVersionId: version.id,
						productId: out.productId,
						quantity: out.quantity ?? 1,
						unitId: out.unitId || product.inventoryUnitId,
						outputRole: out.outputRole ?? (idx === 0 ? OUTPUT_ROLES.PRIMARY : OUTPUT_ROLES.BYPRODUCT),
						costAllocationRatio: out.costAllocationRatio ?? null,
						sortOrder: out.sortOrder ?? idx,
						remark: out.remark ?? null,
						createdById: audit.userId,
						deptId: audit.deptId ?? null,
					},
				});
			}

			// 5. 写入投入清单
			for (let idx = 0; idx < (input.inputs || []).length; idx++) {
				const inp = input.inputs[idx];
				let finalChildBomVersionId = inp.childBomVersionId || null;
				if (inp.childBomId && !finalChildBomVersionId) {
					const childBom = await tx.bom.findUnique({
						where: { id: inp.childBomId },
						select: { currentPublishedVersionId: true },
					});
					finalChildBomVersionId = childBom?.currentPublishedVersionId || null;
				}

				await tx.bomVersionInput.create({
					data: {
						bomVersionId: version.id,
						productId: inp.productId,
						quantity: inp.quantity ?? null,
						unitId: inp.unitId,
						ratio: inp.ratio ?? null,
						materialRole: inp.materialRole ?? MATERIAL_ROLES.MAIN,
						cookedYieldRate: inp.cookedYieldRate ?? null,
						normalLossRate: inp.normalLossRate ?? null,
						supplyPolicy: inp.supplyPolicy ?? SUPPLY_POLICIES.EXTERNAL,
						childBomId: inp.childBomId || null,
						childBomVersionId: finalChildBomVersionId,
						sortOrder: inp.sortOrder ?? idx,
						remark: inp.remark ?? null,
						createdById: audit.userId,
						deptId: audit.deptId ?? null,
					},
				});
			}

			// 6. 写入工艺清单
			for (let idx = 0; idx < (input.operations || []).length; idx++) {
				const op = input.operations[idx];
				await tx.bomVersionOperation.create({
					data: {
						bomVersionId: version.id,
						operationId: op.operationId,
						processingSpecificationId: op.processingSpecificationId || null,
						sequenceNumber: op.sequenceNumber ?? (idx + 1) * 10,
						setupMinutes: op.setupMinutes ?? null,
						cleanupMinutes: op.cleanupMinutes ?? null,
						standardLaborHours: op.standardLaborHours ?? null,
						qualityCheckpoint: op.qualityCheckpoint ?? false,
						instructionText: op.instructionText ?? null,
						instructionParameters: op.instructionParameters ? (op.instructionParameters as TenantPrisma.InputJsonValue) : undefined,
						sortOrder: op.sortOrder ?? idx,
						remark: op.remark ?? null,
						createdById: audit.userId,
						deptId: audit.deptId ?? null,
					},
				});
			}

			// 7. 处理商品默认方案
			if (input.isDefault) {
				// 清除该商品原有的默认 BOM
				await tx.productDefaultBom.updateMany({
					where: { productId: product.id, isDeleted: false },
					data: { isDeleted: true, deletedAt: new Date(), deletedById: audit.userId },
				});
				// 建立新的默认关联
				await tx.productDefaultBom.create({
					data: {
						productId: product.id,
						bomId: bom.id,
						createdById: audit.userId,
						deptId: audit.deptId ?? null,
					},
				});
			}

			return { bomId: bom.id, versionId: version.id };
		});

		return result;
	}

	/**
	 * 编辑 BOM (若最新版本是草稿则原地覆盖更新；若最新版本已发布，则派生新版本号)
	 */
	static async updateBom(
		client: TenantPrismaClient,
		bomId: string,
		input: UpdateBomInput,
		audit: BomAuditContext,
	): Promise<{ bomId: string; versionId: string }> {
		const existing = await client.bom.findUnique({
			where: { id: bomId },
			include: {
				versions: {
					where: { isDeleted: false },
					orderBy: { versionNumber: "desc" },
				},
				defaultBoms: { where: { isDeleted: false } },
			},
		});

		if (!existing || existing.isDeleted) {
			throw new Error("目标 BOM 不存在或已被删除");
		}

		const latestVersion = existing.versions[0];
		const isDraftAction = Boolean(input.isDraft);

		// 判断最新版本是否为草稿态
		const isUpdatingExistingDraft =
			latestVersion && latestVersion.versionStatus === BOM_VERSION_STATUS.DRAFT;

		const targetVersionNumber = isUpdatingExistingDraft
			? latestVersion.versionNumber
			: (latestVersion?.versionNumber ?? 0) + 1;

		return await client.$transaction(async (tx) => {
			let versionId: string;

			if (isUpdatingExistingDraft) {
				// 若目标是草稿，支持在草稿上继续保存更新或直接发布
				versionId = latestVersion.id;
				const newStatus = isDraftAction
					? BOM_VERSION_STATUS.DRAFT
					: BOM_VERSION_STATUS.PUBLISHED;

				await tx.bomVersion.update({
					where: { id: versionId },
					data: {
						versionStatus: newStatus,
						code: input.code?.trim() || latestVersion.code,
						name: input.name?.trim() || latestVersion.name,
						bomType: input.bomType || (latestVersion.bomType as BomType),
						description:
							input.description !== undefined
								? input.description?.trim() || null
								: latestVersion.description,
						productionLineId:
							input.productionLineId !== undefined
								? input.productionLineId
								: latestVersion.productionLineId,
						quantityMode:
							input.quantityMode ||
							(latestVersion.quantityMode as QuantityMode),
						totalYieldEnabled:
							input.totalYieldEnabled !== undefined
								? input.totalYieldEnabled
								: latestVersion.totalYieldEnabled,
						totalYieldRate:
							input.totalYieldRate !== undefined
								? input.totalYieldRate
								: latestVersion.totalYieldRate,
						defaultCookedYieldRate:
							input.defaultCookedYieldRate !== undefined
								? input.defaultCookedYieldRate
								: latestVersion.defaultCookedYieldRate,
						minimumBatchQuantity:
							input.minimumBatchQuantity !== undefined
								? input.minimumBatchQuantity
								: latestVersion.minimumBatchQuantity,
						changeReason: input.changeReason?.trim() || latestVersion.changeReason,
						publishedById: isDraftAction ? null : audit.userId,
						publishedAt: isDraftAction ? null : new Date(),
						updatedAt: new Date(),
					},
				});

				// 清空原有旧子项重新写入
				await tx.bomVersionInput.deleteMany({ where: { bomVersionId: versionId } });
				await tx.bomVersionOutput.deleteMany({ where: { bomVersionId: versionId } });
				await tx.bomVersionOperation.deleteMany({ where: { bomVersionId: versionId } });

				if (!isDraftAction) {
					// 草稿正式发布，切换指针
					await tx.bom.update({
						where: { id: bomId },
						data: { currentPublishedVersionId: versionId },
					});
				}
			} else {
				// 已发布版本不允许原地篡改，必须生成新版本快照 (草稿或发布)
				const targetStatus = isDraftAction
					? BOM_VERSION_STATUS.DRAFT
					: BOM_VERSION_STATUS.PUBLISHED;

				const version = await tx.bomVersion.create({
					data: {
						bomId,
						basedOnVersionId: latestVersion?.id ?? null,
						versionNumber: targetVersionNumber,
						versionStatus: targetStatus,
						code: input.code?.trim() || latestVersion.code,
						name: input.name?.trim() || latestVersion.name,
						bomType: input.bomType || (latestVersion.bomType as BomType),
						description:
							input.description !== undefined
								? input.description?.trim() || null
								: latestVersion.description,
						productionLineId:
							input.productionLineId !== undefined
								? input.productionLineId
								: latestVersion.productionLineId,
						quantityMode:
							input.quantityMode ||
							(latestVersion.quantityMode as QuantityMode),
						totalYieldEnabled:
							input.totalYieldEnabled !== undefined
								? input.totalYieldEnabled
								: latestVersion.totalYieldEnabled,
						totalYieldRate:
							input.totalYieldRate !== undefined
								? input.totalYieldRate
								: latestVersion.totalYieldRate,
						defaultCookedYieldRate:
							input.defaultCookedYieldRate !== undefined
								? input.defaultCookedYieldRate
								: latestVersion.defaultCookedYieldRate,
						minimumBatchQuantity:
							input.minimumBatchQuantity !== undefined
								? input.minimumBatchQuantity
								: latestVersion.minimumBatchQuantity,
						changeReason: input.changeReason?.trim() || "版本迭代更新",
						publishedById: isDraftAction ? null : audit.userId,
						publishedAt: isDraftAction ? null : new Date(),
						createdById: audit.userId,
						deptId: audit.deptId ?? null,
					},
				});
				versionId = version.id;

				if (!isDraftAction) {
					await tx.bom.update({
						where: { id: bomId },
						data: { currentPublishedVersionId: version.id },
					});
				}
			}

			// 3. 写入产出清单
			const outputs = input.outputs && input.outputs.length > 0 ? input.outputs : [];
			for (let idx = 0; idx < outputs.length; idx++) {
				const o = outputs[idx];
				await tx.bomVersionOutput.create({
					data: {
						bomVersionId: versionId,
						productId: o.productId,
						quantity: o.quantity,
						unitId: o.unitId,
						outputRole: o.outputRole ?? (idx === 0 ? OUTPUT_ROLES.PRIMARY : OUTPUT_ROLES.BYPRODUCT),
						costAllocationRatio: o.costAllocationRatio ?? null,
						sortOrder: o.sortOrder ?? idx,
						remark: o.remark ?? null,
						createdById: audit.userId,
						deptId: audit.deptId ?? null,
					},
				});
			}

			// 4. 写入投入清单
			const inputs = input.inputs && input.inputs.length > 0 ? input.inputs : [];
			for (let idx = 0; idx < inputs.length; idx++) {
				const inp = inputs[idx];
				let finalChildBomVersionId = inp.childBomVersionId || null;
				if (inp.childBomId && !finalChildBomVersionId) {
					const childBom = await tx.bom.findUnique({
						where: { id: inp.childBomId },
						select: { currentPublishedVersionId: true },
					});
					finalChildBomVersionId = childBom?.currentPublishedVersionId || null;
				}

				await tx.bomVersionInput.create({
					data: {
						bomVersionId: versionId,
						productId: inp.productId,
						quantity: inp.quantity ?? null,
						unitId: inp.unitId,
						ratio: inp.ratio ?? null,
						materialRole: inp.materialRole ?? MATERIAL_ROLES.MAIN,
						cookedYieldRate: inp.cookedYieldRate ?? null,
						normalLossRate: inp.normalLossRate ?? null,
						supplyPolicy: inp.supplyPolicy ?? SUPPLY_POLICIES.EXTERNAL,
						childBomId: inp.childBomId || null,
						childBomVersionId: finalChildBomVersionId,
						sortOrder: inp.sortOrder ?? idx,
						remark: inp.remark ?? null,
						createdById: audit.userId,
						deptId: audit.deptId ?? null,
					},
				});
			}

			// 5. 写入工艺清单
			const operations = input.operations && input.operations.length > 0 ? input.operations : [];
			for (let idx = 0; idx < operations.length; idx++) {
				const op = operations[idx];
				await tx.bomVersionOperation.create({
					data: {
						bomVersionId: versionId,
						operationId: op.operationId,
						processingSpecificationId: op.processingSpecificationId || null,
						sequenceNumber: op.sequenceNumber ?? (idx + 1) * 10,
						setupMinutes: op.setupMinutes ?? null,
						cleanupMinutes: op.cleanupMinutes ?? null,
						standardLaborHours: op.standardLaborHours ?? null,
						qualityCheckpoint: op.qualityCheckpoint ?? false,
						instructionText: op.instructionText ?? null,
						instructionParameters: op.instructionParameters ? (op.instructionParameters as TenantPrisma.InputJsonValue) : undefined,
						sortOrder: op.sortOrder ?? idx,
						remark: op.remark ?? null,
						createdById: audit.userId,
						deptId: audit.deptId ?? null,
					},
				});
			}

			// 6. 是否默认方案更新
			if (input.isDefault !== undefined && input.productId) {
				if (input.isDefault) {
					await tx.productDefaultBom.updateMany({
						where: { productId: input.productId, isDeleted: false },
						data: { isDeleted: true, deletedAt: new Date(), deletedById: audit.userId },
					});
					await tx.productDefaultBom.create({
						data: {
							productId: input.productId,
							bomId,
							createdById: audit.userId,
							deptId: audit.deptId ?? null,
						},
					});
				} else {
					await tx.productDefaultBom.updateMany({
						where: { bomId, isDeleted: false },
						data: { isDeleted: true, deletedAt: new Date(), deletedById: audit.userId },
					});
				}
			}

			return { bomId, versionId };
		});
	}

	/**
	 * 一键发布指定版本的 BOM 草稿 (原子切换 currentPublishedVersionId)
	 */
	static async publishBomVersion(
		client: TenantPrismaClient,
		bomId: string,
		versionNumber: number,
		audit: BomAuditContext,
	): Promise<void> {
		const targetVersion = await client.bomVersion.findFirst({
			where: { bomId, versionNumber, isDeleted: false },
		});
		if (!targetVersion) {
			throw new Error(`未找到 BOM 对应版本 ${versionNumber}`);
		}
		if (targetVersion.versionStatus === BOM_VERSION_STATUS.PUBLISHED) {
			throw new Error("该版本已经处于发布生效状态");
		}

		await client.$transaction(async (tx) => {
			// 1. 将原 current_published 版本标记为 RETIRED (退役历史版)
			const currentBom = await tx.bom.findUnique({
				where: { id: bomId },
			});
			if (currentBom?.currentPublishedVersionId) {
				await tx.bomVersion.update({
					where: { id: currentBom.currentPublishedVersionId },
					data: { versionStatus: BOM_VERSION_STATUS.RETIRED },
				});
			}

			// 2. 将目标版本置为 PUBLISHED 并记录发布人与时间
			await tx.bomVersion.update({
				where: { id: targetVersion.id },
				data: {
					versionStatus: BOM_VERSION_STATUS.PUBLISHED,
					publishedById: audit.userId,
					publishedAt: new Date(),
				},
			});

			// 3. 将 BOM 族当前生效版本切换至目标版本
			await tx.bom.update({
				where: { id: bomId },
				data: { currentPublishedVersionId: targetVersion.id },
			});
		});
	}

	/**
	 * 软删除 BOM
	 */
	static async deleteBom(
		client: TenantPrismaClient,
		bomId: string,
		audit: BomAuditContext,
	): Promise<void> {
		const bom = await client.bom.findUnique({
			where: { id: bomId },
		});
		if (!bom || bom.isDeleted) {
			throw new Error("BOM 不存在或已被删除");
		}

		await client.$transaction(async (tx) => {
			const now = new Date();
			// 软删除 BOM 族
			await tx.bom.update({
				where: { id: bomId },
				data: { isDeleted: true, deletedAt: now, deletedById: audit.userId },
			});
			// 软删除版本
			await tx.bomVersion.updateMany({
				where: { bomId, isDeleted: false },
				data: { isDeleted: true, deletedAt: now, deletedById: audit.userId },
			});
			// 清除默认 BOM 关系
			await tx.productDefaultBom.updateMany({
				where: { bomId, isDeleted: false },
				data: { isDeleted: true, deletedAt: now, deletedById: audit.userId },
			});
		});
	}

	/**
	 * 设置默认 BOM 方案
	 */
	static async setDefaultBom(
		client: TenantPrismaClient,
		productId: string,
		bomId: string,
		audit: BomAuditContext,
	): Promise<void> {
		await client.$transaction(async (tx) => {
			const now = new Date();
			// 清除该商品当前的所有默认 BOM
			await tx.productDefaultBom.updateMany({
				where: { productId, isDeleted: false },
				data: { isDeleted: true, deletedAt: now, deletedById: audit.userId },
			});
			// 建立新的默认关联
			await tx.productDefaultBom.create({
				data: {
					productId,
					bomId,
					createdById: audit.userId,
					deptId: audit.deptId ?? null,
				},
			});
		});
	}

	/**
	 * 获取表单所需的辅助下拉选项数据 (商品、单位、品类、产线、工序与规格、商品多单位库与默认BOM)
	 */
	static async getFormOptions(client: TenantPrismaClient): Promise<BomFormOptions> {
		const [products, units, categories, productionLines, operations, defaultBoms] =
			await Promise.all([
				client.product.findMany({
					where: { isDeleted: false },
					include: {
						category: true,
						inventoryUnit: true,
						defaultProductionUnit: true,
						defaultPurchaseUnit: true,
						unitConversions: {
							where: { isDeleted: false, status: "ACTIVE" },
							include: { fromUnit: true, toUnit: true },
						},
					},
					orderBy: { name: "asc" },
				}),
				client.unitOfMeasure.findMany({
					where: { isDeleted: false, status: "ACTIVE" },
					select: { id: true, code: true, name: true },
					orderBy: { code: "asc" },
				}),
				client.productCategory.findMany({
					where: { isDeleted: false, status: "ACTIVE" },
					select: { id: true, code: true, name: true },
					orderBy: { sortOrder: "asc" },
				}),
				client.productionLine.findMany({
					where: { isDeleted: false, status: "ACTIVE" },
					select: { id: true, code: true, name: true },
					orderBy: { code: "asc" },
				}),
				client.operation.findMany({
					where: { isDeleted: false, status: "ACTIVE" },
					include: {
						specifications: {
							where: { isDeleted: false, status: "ACTIVE" },
							orderBy: { code: "asc" },
						},
					},
					orderBy: { code: "asc" },
				}),
				client.productDefaultBom.findMany({
					where: { isDeleted: false },
					include: {
						bom: {
							include: {
								currentPublishedVersion: true,
							},
						},
					},
				}),
			]);

		const productDefaultBomMap = new Map<
			string,
			{
				readonly bomId: string;
				readonly bomVersionId: string;
				readonly name: string;
				readonly versionNumber: number;
			}
		>();

		for (const db of defaultBoms) {
			if (db.bom?.currentPublishedVersion) {
				productDefaultBomMap.set(db.productId, {
					bomId: db.bomId,
					bomVersionId: db.bom.currentPublishedVersion.id,
					name: db.bom.currentPublishedVersion.name,
					versionNumber: db.bom.currentPublishedVersion.versionNumber,
				});
			}
		}

		return {
			products: products.map((p) => {
				const availableUnitsMap = new Map<
					string,
					{
						readonly id: string;
						readonly code: string;
						readonly name: string;
						readonly isDefaultProduction?: boolean;
						readonly isDefaultPurchase?: boolean;
						readonly isInventory?: boolean;
					}
				>();

				// 1. 基础库存核算单位
				if (p.inventoryUnit) {
					availableUnitsMap.set(p.inventoryUnit.id, {
						id: p.inventoryUnit.id,
						code: p.inventoryUnit.code,
						name: p.inventoryUnit.name,
						isInventory: true,
					});
				}

				// 2. 默认生产单位
				if (p.defaultProductionUnit) {
					const existing = availableUnitsMap.get(p.defaultProductionUnit.id);
					availableUnitsMap.set(p.defaultProductionUnit.id, {
						id: p.defaultProductionUnit.id,
						code: p.defaultProductionUnit.code,
						name: p.defaultProductionUnit.name,
						...existing,
						isDefaultProduction: true,
					});
				}

				// 3. 默认采购单位
				if (p.defaultPurchaseUnit) {
					const existing = availableUnitsMap.get(p.defaultPurchaseUnit.id);
					availableUnitsMap.set(p.defaultPurchaseUnit.id, {
						id: p.defaultPurchaseUnit.id,
						code: p.defaultPurchaseUnit.code,
						name: p.defaultPurchaseUnit.name,
						...existing,
						isDefaultPurchase: true,
					});
				}

				// 4. 多单位换算库涉及的单位
				for (const uc of p.unitConversions) {
					if (uc.fromUnit && !availableUnitsMap.has(uc.fromUnit.id)) {
						availableUnitsMap.set(uc.fromUnit.id, {
							id: uc.fromUnit.id,
							code: uc.fromUnit.code,
							name: uc.fromUnit.name,
						});
					}
					if (uc.toUnit && !availableUnitsMap.has(uc.toUnit.id)) {
						availableUnitsMap.set(uc.toUnit.id, {
							id: uc.toUnit.id,
							code: uc.toUnit.code,
							name: uc.toUnit.name,
						});
					}
				}

				return {
					id: p.id,
					code: p.code,
					name: p.name,
					productKind: p.productKind,
					inventoryUnitId: p.inventoryUnitId,
					inventoryUnitName: p.inventoryUnit?.name,
					defaultProductionUnitId: p.defaultProductionUnitId,
					defaultPurchaseUnitId: p.defaultPurchaseUnitId,
					categoryId: p.productCategoryId,
					categoryName: p.category?.name,
					availableUnits: Array.from(availableUnitsMap.values()),
					defaultBom: productDefaultBomMap.get(p.id) ?? null,
				};
			}),
			units: units.map((u) => ({ id: u.id, code: u.code, name: u.name })),
			categories: categories.map((c) => ({ id: c.id, code: c.code, name: c.name })),
			productionLines: productionLines.map((l) => ({ id: l.id, code: l.code, name: l.name })),
			operations: operations.map((op) => ({
				id: op.id,
				code: op.code,
				name: op.name,
				defaultYieldRate: op.defaultYieldRate ? Number(op.defaultYieldRate) : null,
				specifications: op.specifications.map((s) => ({
					id: s.id,
					code: s.code,
					name: s.name,
					description: s.description,
					defaultYieldRate: s.defaultYieldRate ? Number(s.defaultYieldRate) : null,
				})),
			})),
		};
	}
}
