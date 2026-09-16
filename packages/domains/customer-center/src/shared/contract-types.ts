import type { StandardAction } from "@base/authorization";
import type {
  CustomerAction,
  CustomerSubject,
} from "../features/customer-management/contract";
import type {
  CustomerCategorySubject,
  CustomerTagSubject,
} from "../features/customer-management/classification/contract";
import type { CustomerStoreSubject } from "../features/store-management/contract";
import type {
  CustomerQuoteAction,
  CustomerQuoteSubject,
} from "../features/quotation-management/contract";

/** 客户中心全域受控实体 Subject 强类型联合 */
export type CustomerSubjectType =
  | CustomerSubject
  | CustomerCategorySubject
  | CustomerTagSubject
  | CustomerStoreSubject
  | CustomerQuoteSubject;

/** 客户中心全域受控操作 Action 强类型联合 */
export type CustomerActionType =
  | StandardAction
  | (typeof CustomerAction)[keyof typeof CustomerAction]
  | (typeof CustomerQuoteAction)[keyof typeof CustomerQuoteAction];
