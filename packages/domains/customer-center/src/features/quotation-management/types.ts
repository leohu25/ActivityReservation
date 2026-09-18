export interface CreateQuoteItemInput {
	itemCode: string;
	itemName: string;
	salesUnit: string;
	unitPriceExclTax: number;
	unitPriceInclTax: number;
	taxRate: number;
	minQty?: number | null;
	maxQty?: number | null;
	remark?: string | null;
}

export interface CreateQuoteInput {
	customerId?: string | null;
	storeId?: string | null;
	regionCode?: string | null;
	quoteDate: string;
	effectiveDate: string;
	expiryDate?: string | null;
	quoteType?: "STANDARD" | "CYCLE";
	displayName?: string | null;
	createdBy: string;
	items: CreateQuoteItemInput[];
}

export interface UpdateQuoteInput {
	customerId?: string | null;
	storeId?: string | null;
	regionCode?: string | null;
	effectiveDate: string;
	expiryDate?: string | null;
	displayName?: string | null;
	items: CreateQuoteItemInput[];
}

export interface ListQuoteFilter {
	customerId?: string;
	storeId?: string;
	regionCode?: string;
	status?: string;
	page?: number;
	pageSize?: number;
}

export interface QuoteItemDetail {
	id?: string;
	itemCode: string;
	itemName: string;
	salesUnit: string;
	unitPriceExclTax: number | unknown;
	unitPriceInclTax: number | unknown;
	taxRate: number | unknown;
	minQty?: number | null | unknown;
	maxQty?: number | null | unknown;
	remark?: string | null;
}

export interface QuoteListItem {
	id: string;
	quoteNo: string;
	displayName?: string | null;
	scopeType?: "CUSTOMER" | "STORE" | "REGION";
	customerId?: string | null;
	customer?: { id?: string; name: string } | null;
	storeId?: string | null;
	store?: { id?: string; name: string } | null;
	regionCode?: string | null;
	quoteDate: string | Date;
	effectiveDate: string | Date;
	expiryDate?: string | Date | null;
	quoteType?: "STANDARD" | "CYCLE";
	status: "ACTIVE" | "DISABLED" | "DRAFT" | "EXPIRED" | "VOIDED";
	itemCount?: number;
	items?: QuoteItemDetail[];
	createdBy?: string;
	createdById?: string;
	createdAt?: string | Date;
	updatedAt?: string | Date;
}
