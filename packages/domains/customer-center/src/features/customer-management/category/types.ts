import type { MasterDataStatus } from "@base/shared";

export type CustomerCategoryStatus = MasterDataStatus;

export interface CreateCategoryInput {
	name: string;
	parentId?: string | null;
	description?: string | null;
}

export interface UpdateCategoryInput {
	name?: string;
	parentId?: string | null;
	description?: string | null;
	status?: CustomerCategoryStatus;
}

export interface CustomerCategoryItem {
	id: string;
	name: string;
	parentId?: string | null;
	description?: string | null;
	status?: CustomerCategoryStatus;
	children?: CustomerCategoryItem[];
	createdAt?: Date;
	updatedAt?: Date;
}
