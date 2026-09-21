import type { MasterDataStatus } from "@base/shared";

export type CustomerTagStatus = MasterDataStatus;

export interface CreateTagInput {
	name: string;
	tagTypeId: string;
	description?: string | null;
}

export interface UpdateTagInput {
	name?: string;
	tagTypeId?: string;
	description?: string | null;
	status?: CustomerTagStatus;
}

export interface CustomerTagItem {
	id: string;
	name: string;
	tagTypeId: string | null;
	/** 关联业务标签数据字典对象 (DTO 投影) */
	tagType?: {
		id: string;
		code: string;
		name: string;
	} | null;
	description?: string | null;
	status?: CustomerTagStatus;
	createdAt?: Date;
	updatedAt?: Date;
}

/** 供标签业务类型选择与回显的字典枚举选项契约 */
export interface TagTypeOption {
	id?: string;
	label: string;
	value: string; // 存储字典项主键 ID
	code?: string; // 字典项业务编码
	isDefault?: boolean;
	sort?: number;
}

