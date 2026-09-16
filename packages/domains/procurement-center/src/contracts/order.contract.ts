import {
  DEPT_DATA_SCOPES,
  getFieldVisibility,
  STANDARD_DATA_SCOPES,
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@base/authorization";

// 1. 实体与资源标识 (CASL Subject & Resource) (SSoT)
export const ProcurementOrderSubject = "PurchaseOrder";
export type ProcurementOrderSubject = typeof ProcurementOrderSubject;
export const ProcurementOrderResource = "procurement.order";
export type ProcurementOrderResource = typeof ProcurementOrderResource;

// @deprecated Compatibility aliases; new authorization code uses canonical names.
export const OrderSubject = ProcurementOrderSubject;
export const OrderResource = ProcurementOrderResource;
// @deprecated Compatibility alias.
export const ProcurementSubject = ProcurementOrderSubject;

// 单据业务状态枚举
export const ProcurementOrderStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type ProcurementOrderStatus =
  (typeof ProcurementOrderStatus)[keyof typeof ProcurementOrderStatus];

// 2. 字段字典枚举 (消除魔法字符串)
export const ProcurementOrderField = {
  ORDER_NO: "orderNo",
  SUPPLIER_NAME: "supplierName",
  QUANTITY: "quantity",
  COST_PRICE: "costPrice",
  STATUS: "status",
  AUDIT_COMMENT: "auditComment",
} as const;

export type ProcurementOrderField =
  (typeof ProcurementOrderField)[keyof typeof ProcurementOrderField];

// 兼容别名导出
export const OrderField = ProcurementOrderField;
export type OrderField = ProcurementOrderField;
export const ProcurementField = ProcurementOrderField;
export type ProcurementField = ProcurementOrderField;

// 3. 受控字段元数据定义
export const procurementOrderConfigurableFields = [
  {
    field: ProcurementOrderField.ORDER_NO,
    label: "采购订单编号",
    isSensitive: false,
  },
  {
    field: ProcurementOrderField.SUPPLIER_NAME,
    label: "供应商名称",
    isSensitive: false,
  },
  {
    field: ProcurementOrderField.QUANTITY,
    label: "物料采购数量",
    isSensitive: false,
  },
  {
    field: ProcurementOrderField.COST_PRICE,
    label: "采购成本单价 (敏感资产)",
    isSensitive: true, // 核心敏感字段：默认按策略进行脱敏遮罩或隐藏
  },
  {
    field: ProcurementOrderField.STATUS,
    label: "订单审批状态",
    isSensitive: false,
  },
  {
    field: ProcurementOrderField.AUDIT_COMMENT,
    label: "审核意见备注",
    isSensitive: false,
  },
] as const;

export const procurementConfigurableFields = procurementOrderConfigurableFields;

// 允许在新建/编辑表单中提交的受控字段白名单
export const procurementOrderCreateFields = [
  ProcurementOrderField.SUPPLIER_NAME,
  ProcurementOrderField.QUANTITY,
  ProcurementOrderField.COST_PRICE,
] as const;

export const procurementCreateFields = procurementOrderCreateFields;

// 采购领域扩展操作动作
export const ProcurementAction = {
  ...StandardAction,
  AUDIT: "audit",
} as const;

export type ProcurementAction =
  | (typeof StandardAction)[keyof typeof StandardAction]
  | "audit";

// 4. 页面级纯数据权限契约 (SSoT)
export const procurementOrderPageContract: FeaturePagePermissionDescriptor = {
  resource: ProcurementOrderResource,
  subject: ProcurementOrderSubject,
  label: "采购订单管理",
  path: "/procurement/orders",
  actions: [
    {
      action: StandardAction.READ,
      label: "查看单据",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
    { action: StandardAction.CREATE, label: "新建采购" },
    {
      action: StandardAction.UPDATE,
      label: "修改单据",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
    {
      action: ProcurementAction.AUDIT,
      label: "单据审核",
      supportedScopes: DEPT_DATA_SCOPES,
    },
    {
      action: StandardAction.EXPORT,
      label: "数据导出",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
  ],
  configurableFields: procurementOrderConfigurableFields.map((f) => ({
    field: f.field,
    label: f.label,
    sensitive: f.isSensitive,
  })),
} as const;

// 兼容别名导出
export const orderPageContract = procurementOrderPageContract;

/**
 * 契约级字段可见性辅助工具
 */
export function getProcurementFieldVisibility(ability: {
  can(action: string, subject: string, field?: string): boolean;
}) {
  return getFieldVisibility(
    ability,
    ProcurementOrderSubject,
    Object.values(ProcurementOrderField),
  );
}
