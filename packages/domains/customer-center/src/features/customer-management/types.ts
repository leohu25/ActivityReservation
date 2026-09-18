import type { CustomerCategoryItem } from "./category/types";
import type { CustomerTagItem } from "./tag/types";
import type { MasterDataStatus } from "@base/shared";

export type CustomerStatus = MasterDataStatus;

export type { CustomerCategoryItem } from "./category/types";
export type { CustomerTagItem } from "./tag/types";

/** 列表页下拉选项（与筛选解耦，可缓存在壳层） */
export interface CustomerPageOptions {
	categoryOptions: CustomerCategoryItem[];
	tagOptions: CustomerTagItem[];
}

export interface CreateCustomerInput {
	name: string;
	categoryId: string;
	contactPerson: string;
	contactPhone: string;
	settlementMethod: "MONTHLY" | "CASH" | "PREPAID";
	defaultTaxRate?: number | null;
	creditLimit?: number | null;
	tagIds?: string[];
	salesPerson?: string | null;
	defaultWarehouse?: string | null;
	paymentCycle?: string | null;
	serviceTime?: string | null;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
	status?: CustomerStatus;
}

export interface ListCustomerFilter {
	categoryId?: string;
	status?: string;
	keyword?: string;
	tagId?: string;
	page?: number;
	pageSize?: number;
}

export interface CustomerListItem {
	/** 实体唯一主键标识（稳定 rowKey 与行操作目标） */
	id: string;
	name: string;
	categoryId: string;
	category?: CustomerCategoryItem | null;
	contactPerson: string;
	contactPhone: string;
	settlementMethod: "MONTHLY" | "CASH" | "PREPAID";
	defaultTaxRate?: number | null | unknown;
	creditLimit?: number | null | unknown;
	customerTags?: string | null;
	salesPerson?: string | null;
	defaultWarehouse?: string | null;
	paymentCycle?: string | null;
	serviceTime?: string | null;
	status: "ACTIVE" | "DISABLED";
	_count?: { stores?: number };
}
