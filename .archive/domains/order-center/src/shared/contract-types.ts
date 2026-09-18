import type { StandardAction } from "@base/authorization";
import type {
  SalesOrderAction,
  SalesOrderSubject,
} from "../features/sales-order/contract";

/** 订单中心受控实体 Subject 强类型联合 */
export type OrderSubjectType = SalesOrderSubject;

/** 订单中心受控操作 Action 强类型联合 */
export type OrderActionType =
  | StandardAction
  | (typeof SalesOrderAction)[keyof typeof SalesOrderAction];
