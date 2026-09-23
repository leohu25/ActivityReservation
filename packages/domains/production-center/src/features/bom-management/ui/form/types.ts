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
}

export interface FormOperationRow {
	operationId: string;
	sequenceNumber: number;
	standardLaborHours: number;
	qualityCheckpoint: boolean;
	instructionText: string;
}
