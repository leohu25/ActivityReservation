export interface CreateCustomerInput {
  customerName: string;
  categoryCode: string;
  contactPerson: string;
  contactPhone: string;
  settlementMethod: "MONTHLY" | "CASH" | "PREPAID";
  defaultTaxRate?: number | null;
  creditLimit?: number | null;
  tagCodes?: string[];
  salesPerson?: string | null;
  defaultWarehouse?: string | null;
  paymentCycle?: string | null;
  serviceTime?: string | null;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  status?: "ACTIVE" | "DISABLED";
}

export interface CreateStoreInput {
  customerCode: string;
  storeName: string;
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
  customerCode?: string | null;
  storeCode?: string | null;
  regionCode?: string | null;
  quoteDate: string;
  effectiveDate: string;
  expiryDate?: string | null;
  quoteType?: "STANDARD" | "CYCLE";
  displayName?: string | null;
  createdBy: string;
  items: CreateQuoteItemInput[];
}
