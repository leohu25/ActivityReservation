import type {
	BomType,
	QuantityMode,
	BomVersionStatus,
	MaterialRole,
	OutputRole,
	SupplyPolicy,
} from "./contract";

/** BOM 列表行展示 DTO */
export interface BomListItemDto {
	readonly id: string; // bom.id
	readonly versionId: string; // bom_version.id
	readonly code: string; // 该版本 BOM 编码
	readonly name: string; // 该版本 BOM 名称
	readonly bomType: BomType;
	readonly bomTypeLabel: string;
	readonly productionLineId?: string | null;
	readonly productionLineName?: string | null;
	readonly productId: string; // 主产出商品 ID
	readonly productName: string; // 主产出商品名称
	readonly productCode: string; // 主产出商品编码
	readonly productCategoryName?: string | null; // 主产出商品分类
	readonly isDefault: boolean; // 是否商品默认方案
	readonly versionNumber: number; // 版本号
	readonly versionStatus: BomVersionStatus; // 版本状态
	readonly operations: readonly string[]; // 包含的工序名称标签
	readonly createdAt: string;
	readonly updatedAt: string;
}

/** 投入行 DTO */
export interface BomInputItemDto {
	readonly id?: string;
	readonly productId: string;
	readonly productName?: string;
	readonly productCode?: string;
	readonly quantity?: number | null; // FIXED 模式毛投入
	readonly unitId: string;
	readonly unitName?: string;
	readonly ratio?: number | null; // RATIO 模式配方占比 (0~1)
	readonly materialRole: MaterialRole;
	readonly cookedYieldRate?: number | null; // 原料熟出成率
	readonly normalLossRate?: number | null; // 正常损耗率
	readonly supplyPolicy: SupplyPolicy;
	readonly childBomId?: string | null;
	readonly childBomName?: string | null;
	readonly childBomVersionId?: string | null;
	readonly childBomVersionNumber?: number | null;
	readonly latestChildBomVersionId?: string | null;
	readonly latestChildBomVersionNumber?: number | null;
	readonly sortOrder: number;
	readonly remark?: string | null;
}

/** 产出行 DTO */
export interface BomOutputItemDto {
	readonly id?: string;
	readonly productId: string;
	readonly productName?: string;
	readonly productCode?: string;
	readonly quantity: number;
	readonly unitId: string;
	readonly unitName?: string;
	readonly outputRole: OutputRole; // PRIMARY | BYPRODUCT
	readonly costAllocationRatio?: number | null;
	readonly sortOrder: number;
	readonly remark?: string | null;
}

/** 工艺行 DTO */
export interface BomOperationItemDto {
	readonly id?: string;
	readonly operationId: string;
	readonly operationName?: string;
	readonly operationCode?: string;
	readonly processingSpecificationId?: string | null;
	readonly processingSpecificationName?: string | null;
	readonly sequenceNumber: number;
	readonly setupMinutes?: number | null;
	readonly cleanupMinutes?: number | null;
	readonly standardLaborHours?: number | null;
	readonly qualityCheckpoint: boolean;
	readonly instructionText?: string | null;
	readonly instructionParameters?: Record<string, unknown> | null;
	readonly sortOrder: number;
	readonly remark?: string | null;
}

/** BOM 版本历史条目 DTO */
export interface BomVersionSummaryDto {
	readonly id: string;
	readonly versionNumber: number;
	readonly versionStatus: BomVersionStatus;
	readonly code: string;
	readonly name: string;
	readonly publishedAt?: string | null;
	readonly changeReason?: string | null;
}

/** BOM 详情完整 DTO */
export interface BomDetailDto {
	readonly id: string; // bom.id
	readonly lifecycleStatus: string;
	readonly isDefault: boolean;
	readonly primaryProduct: {
		readonly id: string;
		readonly code: string;
		readonly name: string;
		readonly categoryName?: string | null;
		readonly unitName?: string | null;
	};
	readonly currentVersion: {
		readonly id: string;
		readonly bomId: string;
		readonly versionNumber: number;
		readonly versionStatus: BomVersionStatus;
		readonly code: string;
		readonly name: string;
		readonly bomType: BomType;
		readonly description?: string | null;
		readonly productionLineId?: string | null;
		readonly productionLineName?: string | null;
		readonly quantityMode: QuantityMode;
		readonly totalYieldEnabled: boolean;
		readonly totalYieldRate?: number | null;
		readonly defaultCookedYieldRate?: number | null;
		readonly minimumBatchQuantity?: number | null;
		readonly inputs: readonly BomInputItemDto[];
		readonly outputs: readonly BomOutputItemDto[];
		readonly operations: readonly BomOperationItemDto[];
	};
	readonly versionHistory: readonly BomVersionSummaryDto[];
}

/** 新建 BOM 输入契约 */
export interface CreateBomInput {
	readonly bomType: BomType;
	readonly code: string;
	readonly name: string;
	readonly productId: string; // BOM 主商品
	readonly productionLineId?: string | null;
	readonly description?: string | null;
	readonly quantityMode?: QuantityMode;
	readonly totalYieldEnabled?: boolean;
	readonly totalYieldRate?: number | null;
	readonly defaultCookedYieldRate?: number | null;
	readonly minimumBatchQuantity?: number | null;
	readonly isDefault?: boolean;
	readonly isDraft?: boolean;
	readonly inputs: readonly {
		readonly productId: string;
		readonly quantity?: number | null;
		readonly unitId: string;
		readonly ratio?: number | null;
		readonly materialRole?: MaterialRole;
		readonly cookedYieldRate?: number | null;
		readonly normalLossRate?: number | null;
		readonly supplyPolicy?: SupplyPolicy;
		readonly childBomId?: string | null;
		readonly childBomVersionId?: string | null;
		readonly sortOrder?: number;
		readonly remark?: string | null;
	}[];
	readonly outputs: readonly {
		readonly productId: string;
		readonly quantity: number;
		readonly unitId: string;
		readonly outputRole?: OutputRole;
		readonly costAllocationRatio?: number | null;
		readonly sortOrder?: number;
		readonly remark?: string | null;
	}[];
	readonly operations: readonly {
		readonly operationId: string;
		readonly processingSpecificationId?: string | null;
		readonly sequenceNumber: number;
		readonly setupMinutes?: number | null;
		readonly cleanupMinutes?: number | null;
		readonly standardLaborHours?: number | null;
		readonly qualityCheckpoint?: boolean;
		readonly instructionText?: string | null;
		readonly instructionParameters?: Record<string, unknown> | null;
		readonly sortOrder?: number;
		readonly remark?: string | null;
	}[];
}

/** 编辑 BOM 输入契约 */
export interface UpdateBomInput extends Partial<CreateBomInput> {
	readonly changeReason?: string | null;
}

/** 列表查询过滤参数 */
export interface ListBomFilter {
	readonly page?: number;
	readonly pageSize?: number;
	readonly keyword?: string;
	readonly bomType?: string;
	readonly categoryId?: string;
	readonly status?: string;
	readonly productionLineId?: string;
}

/** 列表分页返回 */
export interface ListBomsResult {
	readonly items: readonly BomListItemDto[];
	readonly total: number;
	readonly page: number;
	readonly pageSize: number;
}

/** 商品可用单位定义 */
export interface ProductAvailableUnit {
	readonly id: string;
	readonly code: string;
	readonly name: string;
	readonly isDefaultProduction?: boolean;
	readonly isDefaultPurchase?: boolean;
	readonly isInventory?: boolean;
}

/** 商品默认 BOM 摘要 */
export interface ProductDefaultBomInfo {
	readonly bomId: string;
	readonly bomVersionId: string;
	readonly name: string;
	readonly versionNumber: number;
}

/** 工序规格简要项 */
export interface OperationSpecificationItem {
	readonly id: string;
	readonly code: string;
	readonly name: string;
	readonly description?: string | null;
	readonly defaultYieldRate?: number | null;
}

/** 页面辅助下拉数据项 */
export interface BomFormOptions {
	readonly products: readonly {
		readonly id: string;
		readonly code: string;
		readonly name: string;
		readonly productKind: string;
		readonly inventoryUnitId: string;
		readonly inventoryUnitName?: string;
		readonly defaultProductionUnitId?: string | null;
		readonly defaultPurchaseUnitId?: string | null;
		readonly categoryId: string;
		readonly categoryName?: string;
		readonly availableUnits: readonly ProductAvailableUnit[];
		readonly defaultBom?: ProductDefaultBomInfo | null;
	}[];
	readonly units: readonly {
		readonly id: string;
		readonly code: string;
		readonly name: string;
	}[];
	readonly categories: readonly {
		readonly id: string;
		readonly code: string;
		readonly name: string;
	}[];
	readonly productionLines: readonly {
		readonly id: string;
		readonly code: string;
		readonly name: string;
	}[];
	readonly operations: readonly {
		readonly id: string;
		readonly code: string;
		readonly name: string;
		readonly defaultYieldRate?: number | null;
		readonly specifications: readonly OperationSpecificationItem[];
	}[];
}
