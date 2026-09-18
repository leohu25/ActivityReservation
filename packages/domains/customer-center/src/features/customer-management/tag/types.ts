import type { MasterDataStatus } from "@base/shared";

export type CustomerTagStatus = MasterDataStatus;

export interface CreateTagInput {
	name: string;
	tagType: string;
	description?: string | null;
}

export interface UpdateTagInput {
	name?: string;
	tagType?: string;
	description?: string | null;
	status?: CustomerTagStatus;
}

export interface CustomerTagItem {
	id: string;
	name: string;
	tagType: string;
	description?: string | null;
	status?: CustomerTagStatus;
	createdAt?: Date;
	updatedAt?: Date;
}
