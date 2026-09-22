export interface SupplierDto {
	readonly id: string;
	readonly code: string;
	readonly name: string;
	readonly status: string;
}

export interface SupplierProductDto {
	readonly id: string;
	readonly supplierId: string;
	readonly productId: string;
	readonly status: string;
}
