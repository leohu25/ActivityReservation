import { StandardAction } from "@chenrun/authorization";

/** 客户中心特定业务操作动作 */
export const CustomerAction = {
  ...StandardAction,
  AUDIT: "audit",
} as const;

export * from "./customer.contract";
export * from "./store.contract";
export * from "./category-tag.contract";
export * from "./quote.contract";
