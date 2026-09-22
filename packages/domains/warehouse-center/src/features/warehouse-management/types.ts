export interface WarehouseDto {
	readonly id: string;
	readonly code: string;
	readonly name: string;
	readonly status: string;
}

export interface WarehouseLocationDto {
	readonly id: string;
	readonly warehouseId: string;
	readonly code: string;
	readonly status: string;
}
