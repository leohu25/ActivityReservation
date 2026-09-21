import type { StandardAction } from "@base/authorization";
import type {
	TenantDictItemAction,
	TenantDictItemSubject,
} from "../features/dict/contract";

/** 基础档案全域受控实体 Subject 强类型联合 */
export type BaseArchivesSubjectType = TenantDictItemSubject;

/** 基础档案全域受控操作 Action 强类型联合 */
export type BaseArchivesActionType =
	| StandardAction
	| (typeof TenantDictItemAction)[keyof typeof TenantDictItemAction];
