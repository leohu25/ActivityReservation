/**
 * 采购中心权限与字段策略常量 (Code-as-Config)
 */
export const P = {
  procurement: {
    order: {
      create: "procurement.order.create",
      read: "procurement.order.read",
      update: "procurement.order.update",
      delete: "procurement.order.delete",
      approve: "procurement.order.approve",
    },
  },
} as const;

export const F = {
  procurement: {
    order: {
      costPrice: "procurement.order.costPrice",
    },
  },
} as const;
