import type { BomDetailDto } from "../../types";

export interface BomFlowGraphProps {
	readonly detail: BomDetailDto;
	readonly onNavigateBom?: (bomId: string) => void;
}

export interface GraphInputNode {
	readonly id: string;
	readonly name: string;
	readonly quantity: string;
	readonly unit: string;
	readonly cost: string;
	readonly isSubBom: boolean;
	readonly childBomId?: string | null;
}

export interface GraphOperationNode {
	readonly id: string;
	readonly name: string;
	readonly yieldRate: string;
	readonly isCheckpoint: boolean;
	readonly laborHours?: string | null;
}

export interface GraphOutputNode {
	readonly id: string;
	readonly name: string;
	readonly quantity: string;
	readonly unit: string;
	readonly cost: string;
	readonly isPrimary: boolean;
}

export interface GraphLayoutMetrics {
	readonly nodeHeight: number;
	readonly nodeGap: number;
	readonly inputsTotalHeight: number;
	readonly containerHeight: number;
	readonly centerY: number;
	readonly hasExpandedSubBom: boolean;
	readonly col2X: number;
	readonly busLineX: number;
	readonly opsStartX: number;
	readonly minWidth: number;
}
