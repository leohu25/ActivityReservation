/**
 * 采购中心功能权限目录 (Better Auth Access Control Statement)
 */
export const procurementStatement = {
  "procurement.order": ["read", "create", "update", "audit", "export"],
} as const;

/**
 * CASL 对应的主体与字段契约
 */
export const ProcurementSubject = "PurchaseOrder" as const;

export const ProcurementFields = {
  supplierName: "supplierName",
  quantity: "quantity",
  costPrice: "costPrice",
} as const;

/**
 * UI 中文展示元数据 (仅用于管理页面渲染，非安全事实源)
 */
export const procurementLabels = {
  "procurement.order": {
    label: "采购订单",
    actions: {
      read: "查看",
      create: "新建",
      update: "修改",
      audit: "审核",
      export: "导出",
    },
  },
} as const;
