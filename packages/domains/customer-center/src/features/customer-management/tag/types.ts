import type { MasterDataStatus } from "@base/shared";

export type CustomerTagStatus = MasterDataStatus;

export interface CreateTagInput {
	tagCode?: string;
	tagName: string;
	tagType: string;
	description?: string | null;
}

export interface UpdateTagInput {
	tagName: string;
	tagType: string;
	description?: string | null;
	status?: CustomerTagStatus;
}

export interface CustomerTagItem {
	id?: string;
	tagCode: string;
	tagName: string;
	tagType?: string;
	description?: string | null;
	status?: CustomerTagStatus;
}
