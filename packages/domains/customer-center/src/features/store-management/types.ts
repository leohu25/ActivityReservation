export interface CreateStoreInput {
	customerId: string;
	name: string;
	address: string;
	contactPerson: string;
	contactPhone: string;
	regionCode: string;
	deliveryPeriod?: string | null;
	defaultRoute?: string | null;
	defaultDriver?: string | null;
	storeTags?: string | null;
	billingContact?: string | null;
	billingPhone?: string | null;
}

export interface UpdateStoreInput extends Partial<CreateStoreInput> {
	status?: "ACTIVE" | "DISABLED";
}

export interface ListStoreFilter {
	customerId?: string;
	regionCode?: string;
	status?: string;
	keyword?: string;
	page?: number;
	pageSize?: number;
}

export interface StoreListItem {
	id: string;
	name: string;
	customerId: string;
	customer?: {
		id?: string;
		name: string;
		status?: string;
	} | null;
	regionCode: string;
	businessType?: string | null;
	operatingMode?: string | null;
	address: string;
	contactPerson: string;
	contactPhone: string;
	deliveryPeriod?: string | null;
	defaultRoute?: string | null;
	defaultDriver?: string | null;
	billingContact?: string | null;
	billingPhone?: string | null;
	status: "ACTIVE" | "DISABLED";
}
