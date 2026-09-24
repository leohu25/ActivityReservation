export interface ProcessingSpecificationItem {
	readonly id: string;
	readonly operationId: string;
	readonly code: string;
	readonly name: string;
	readonly description: string | null;
	readonly defaultYieldRate: number | null;
	readonly status: string;
	readonly createdAt?: string;
	readonly updatedAt?: string;
}

export interface ProcessingSpecificationInput {
	readonly id?: string | null;
	readonly code: string;
	readonly name: string;
	readonly description?: string | null;
	readonly defaultYieldRate?: number | null;
	readonly status?: string;
}
