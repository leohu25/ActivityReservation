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
