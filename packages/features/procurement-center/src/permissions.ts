/** 采购订单的 Resource -> Actions 是该切片唯一的功能权限事实。 */
const procurementOrderActions = [
  "read",
  "create",
  "update",
  "audit",
  "export",
] as const;

export const ProcurementPermission = {
  order: {
    resource: "procurement.order",
    subject: "PurchaseOrder",
    label: "采购订单管理",
    actions: procurementOrderActions,
    fields: [
      "orderNo",
      "supplierName",
      "quantity",
      "costPrice",
      "status",
      "auditComment",
    ],
    actionMetadata: {
      read: {
        label: "查看采购订单",
        scopes: ["SELF", "DEPT", "DEPT_TREE", "ALL"],
        fields: [
          "orderNo",
          "supplierName",
          "quantity",
          "costPrice",
          "status",
          "auditComment",
        ],
      },
      create: {
        label: "新建采购订单",
        fields: ["supplierName", "quantity", "costPrice"],
      },
      update: {
        label: "修改采购订单",
        scopes: ["SELF", "DEPT", "DEPT_TREE", "ALL"],
        fields: ["supplierName", "quantity", "costPrice"],
      },
      audit: {
        label: "审核采购订单",
        scopes: ["DEPT", "DEPT_TREE", "ALL"],
        fields: ["status", "auditComment"],
      },
      export: {
        label: "导出采购订单",
        scopes: ["SELF", "DEPT", "DEPT_TREE", "ALL"],
        fields: ["orderNo", "supplierName", "quantity", "status"],
      },
    },
  },
} as const;

export type ProcurementAction = (typeof procurementOrderActions)[number];
export const ProcurementSubject = ProcurementPermission.order.subject;

/** Better Auth 应用层组合入口。 */
export const procurementStatement = {
  [ProcurementPermission.order.resource]: ProcurementPermission.order.actions,
} as const;

/** CASL Resource -> Subject 映射入口。 */
export const procurementPermissionDefinition = ProcurementPermission.order;

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
