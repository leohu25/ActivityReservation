import type { MasterDataStatus } from "@base/shared";

export type TenantDictItemStatus = MasterDataStatus;

export interface TenantDictItemDto {
	id: string;
	type: string;
	code: string;
	name: string;
	status: TenantDictItemStatus;
	sort: number;
	isDefault: boolean;
	remark: string | null;
	createdAt?: string;
	updatedAt?: string;
}

export interface CreateDictItemInput {
	type: string;
	code: string;
	name: string;
	status?: TenantDictItemStatus;
	sort?: number;
	isDefault?: boolean;
	remark?: string | null;
}

export interface UpdateDictItemInput {
	id: string;
	name?: string;
	status?: TenantDictItemStatus;
	sort?: number;
	isDefault?: boolean;
	remark?: string | null;
}

/** 供前端 Select / Radio / Combobox 等直接消费的精简选项契约 */
export interface DictOption {
	id?: string;
	label: string;
	value: string; // 默认存储字典项主键 ID
	code?: string; // 字典项业务编码
	isDefault?: boolean;
	sort?: number;
}
