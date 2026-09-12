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

export interface ListQuoteFilter {
  customerCode?: string;
  storeCode?: string;
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
  id?: string;
  quoteId: string;
  quoteNo?: string;
  displayName?: string | null;
  scopeType?: "CUSTOMER" | "STORE" | "REGION";
  customerCode?: string | null;
  customer?: { customerName: string; customerCode?: string } | null;
  storeCode?: string | null;
  store?: { storeName?: string; storeCode?: string } | null;
  regionCode?: string | null;
  quoteDate: string | Date;
  effectiveDate: string | Date;
  expiryDate?: string | Date | null;
  quoteType?: "STANDARD" | "CYCLE" | string;
  status: "ACTIVE" | "DISABLED" | "DRAFT" | "EXPIRED" | "VOIDED" | string;
  itemCount?: number;
  items?: QuoteItemDetail[];
}
