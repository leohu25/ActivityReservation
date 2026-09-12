import type { CustomerCategoryItem } from "./classification/types";

export type {
  CustomerCategoryItem,
  CustomerTagItem,
} from "./classification/types";

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

export interface ListCustomerFilter {
  categoryCode?: string;
  status?: string;
  keyword?: string;
  tagCode?: string;
  page?: number;
  pageSize?: number;
}

export interface CustomerListItem {
  /** 实体唯一主键标识（稳定 rowKey 与行操作目标，不受业务字段隐藏策略影响） */
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
  _count?: { stores?: number };
}
