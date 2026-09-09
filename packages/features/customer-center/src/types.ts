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

export interface CustomerCategoryItem {
  id?: string;
  categoryCode: string;
  categoryName: string;
  parentCode?: string | null;
  description?: string | null;
  status?: "ACTIVE" | "DISABLED" | string;
}

export interface CustomerTagItem {
  id?: string;
  tagCode: string;
  tagName: string;
  tagType?: string;
  description?: string | null;
  status?: "ACTIVE" | "DISABLED" | string;
}

export interface CustomerListItem {
  id?: string;
  customerCode: string;
  customerName: string;
  categoryCode: string;
  category?: CustomerCategoryItem | null;
  contactPerson: string;
  contactPhone: string;
  settlementMethod: "MONTHLY" | "CASH" | "PREPAID" | string;
  defaultTaxRate?: number | null | unknown;
  creditLimit?: number | null | unknown;
  customerTags?: string | null;
  salesPerson?: string | null;
  defaultWarehouse?: string | null;
  paymentCycle?: string | null;
  serviceTime?: string | null;
  status: "ACTIVE" | "DISABLED" | string;
  _count?: {
    stores?: number;
  };
  stores?: Array<{ id?: string; storeCode?: string }>;
}

export interface StoreListItem {
  id?: string;
  storeCode: string;
  storeName: string;
  customerCode: string;
  customer?: {
    customerName: string;
    customerCode?: string;
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
  status: "ACTIVE" | "DISABLED" | string;
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
  id?: string;
  quoteId: string;
  quoteNo?: string;
  displayName?: string | null;
  scopeType?: "CUSTOMER" | "STORE" | "REGION";
  customerCode?: string | null;
  customer?: {
    customerName: string;
    customerCode?: string;
  } | null;
  storeCode?: string | null;
  store?: {
    storeName?: string;
    storeCode?: string;
  } | null;
  regionCode?: string | null;
  quoteDate: string | Date;
  effectiveDate: string | Date;
  expiryDate?: string | Date | null;
  quoteType?: "STANDARD" | "CYCLE" | string;
  status: "ACTIVE" | "DISABLED" | "DRAFT" | "EXPIRED" | "VOIDED" | string;
  itemCount?: number;
  items?: QuoteItemDetail[];
}
