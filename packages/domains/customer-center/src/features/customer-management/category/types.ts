import type { MasterDataStatus } from "@base/shared";

export type CustomerCategoryStatus = MasterDataStatus;

export interface CreateCategoryInput {
	categoryCode?: string;
	categoryName: string;
	parentCode?: string | null;
	description?: string | null;
}

export interface UpdateCategoryInput {
	categoryName: string;
	parentCode?: string | null;
	description?: string | null;
	status?: CustomerCategoryStatus;
}

export interface CustomerCategoryItem {
	id?: string;
	categoryCode: string;
	categoryName: string;
	parentCode?: string | null;
	description?: string | null;
	status?: CustomerCategoryStatus;
	children?: CustomerCategoryItem[];
}
