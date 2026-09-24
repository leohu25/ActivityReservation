import type { ProcessingSpecificationInput } from "../../specification/types";

export interface OperationFormData extends Record<string, unknown> {
	code: string;
	name: string;
	operationCategoryDictItemId: string;
	defaultSetupMinutes: number;
	defaultCleanupMinutes: number;
	defaultYieldRate: number | null;
	minimumOperatorCount: number | null;
	minimumBatchQuantity: number | null;
	minimumBatchUnitId: string | null;
	sopText: string | null;
	status: string;
	specifications: readonly ProcessingSpecificationInput[];
}
