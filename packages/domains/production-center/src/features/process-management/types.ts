import type {
	ProcessingSpecificationInput,
	ProcessingSpecificationItem,
} from "./specification/types";

export * from "./specification/types";

export interface OperationDto {
	readonly id: string;
	readonly code: string;
	readonly name: string;
	readonly status: string;
}

export interface ProcessingSpecificationDto {
	readonly id: string;
	readonly operationId: string;
	readonly code: string;
	readonly name: string;
	readonly status: string;
}

export interface OperationListItem {
	readonly id: string;
	readonly code: string;
	readonly name: string;
	readonly operationCategoryDictItemId: string;
	readonly categoryName: string;
	readonly defaultSetupMinutes: number;
	readonly defaultCleanupMinutes: number;
	readonly defaultYieldRate: number | null;
	readonly minimumOperatorCount: number | null;
	readonly minimumBatchQuantity: number | null;
	readonly minimumBatchUnitId: string | null;
	readonly minimumBatchUnitName: string | null;
	readonly sopText: string | null;
	readonly specificationsCount: number;
	readonly status: string;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface OperationDetail {
	readonly id: string;
	readonly code: string;
	readonly name: string;
	readonly operationCategoryDictItemId: string;
	readonly categoryName: string;
	readonly defaultSetupMinutes: number;
	readonly defaultCleanupMinutes: number;
	readonly defaultYieldRate: number | null;
	readonly minimumOperatorCount: number | null;
	readonly minimumBatchQuantity: number | null;
	readonly minimumBatchUnitId: string | null;
	readonly minimumBatchUnitName: string | null;
	readonly sopText: string | null;
	readonly status: string;
	readonly createdAt: string;
	readonly updatedAt: string;
	readonly specifications: readonly ProcessingSpecificationItem[];
}

export interface CreateOperationInput {
	readonly code: string;
	readonly name: string;
	readonly operationCategoryDictItemId: string;
	readonly defaultSetupMinutes?: number;
	readonly defaultCleanupMinutes?: number;
	readonly defaultYieldRate?: number | null;
	readonly minimumOperatorCount?: number | null;
	readonly minimumBatchQuantity?: number | null;
	readonly minimumBatchUnitId?: string | null;
	readonly sopText?: string | null;
	readonly status?: string;
	readonly specifications: readonly ProcessingSpecificationInput[];
}

export interface UpdateOperationInput {
	readonly code?: string;
	readonly name?: string;
	readonly operationCategoryDictItemId?: string;
	readonly defaultSetupMinutes?: number;
	readonly defaultCleanupMinutes?: number;
	readonly defaultYieldRate?: number | null;
	readonly minimumOperatorCount?: number | null;
	readonly minimumBatchQuantity?: number | null;
	readonly minimumBatchUnitId?: string | null;
	readonly sopText?: string | null;
	readonly status?: string;
	readonly specifications?: readonly ProcessingSpecificationInput[];
}

export interface ListOperationsFilter {
	readonly page?: number;
	readonly pageSize?: number;
	readonly keyword?: string;
	readonly categoryId?: string;
	readonly status?: string;
}

export interface OperationFormOptions {
	readonly categories: readonly {
		readonly id: string;
		readonly name: string;
		readonly code?: string;
	}[];
	readonly units: readonly {
		readonly id: string;
		readonly name: string;
		readonly code: string;
	}[];
}
