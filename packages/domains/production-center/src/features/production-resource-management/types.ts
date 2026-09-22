export interface WorkshopDto {
	readonly id: string;
	readonly code: string;
	readonly name: string;
	readonly status: string;
}

export interface ProductionLineDto {
	readonly id: string;
	readonly workshopId: string;
	readonly code: string;
	readonly name: string;
	readonly status: string;
}
