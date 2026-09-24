import type { FormPageMode } from "@base/ui";
import type { BomDetailDto, BomFormOptions } from "../../types";

export interface BomFormPageProps {
	readonly mode?: FormPageMode;
	readonly bomId?: string;
	readonly initialDetail?: BomDetailDto | null;
	readonly formOptions: BomFormOptions;
	readonly backUrl?: string;
}

export interface FormInputRow {
	productId: string;
	quantity: number;
	unitId: string;
	ratio: number;
	materialRole: string;
	cookedYieldRate: number;
	normalLossRate: number;
	supplyPolicy?: string;
	childBomId?: string | null;
	childBomName?: string | null;
	childBomVersionId?: string | null;
	childBomVersionNumber?: number | null;
	latestChildBomVersionId?: string | null;
	latestChildBomVersionNumber?: number | null;
}

export interface FormByProductRow {
	productId: string;
	quantity: number;
	unitId: string;
	costAllocationRatio?: number;
}

export interface FormOperationRow {
	operationId: string;
	processingSpecificationId?: string | null;
	sequenceNumber: number;
	standardLaborHours: number;
	qualityCheckpoint: boolean;
	instructionText: string;
}
