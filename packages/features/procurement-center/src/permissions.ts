import { DataScope } from "@chenrun/authorization";

/** 采购订单状态枚举，内聚于采购中心领域。 */
export const ProcurementOrderStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type ProcurementOrderStatus =
  (typeof ProcurementOrderStatus)[keyof typeof ProcurementOrderStatus];

export const ProcurementField = {
  ORDER_NO: "orderNo",
  SUPPLIER_NAME: "supplierName",
  QUANTITY: "quantity",
  COST_PRICE: "costPrice",
  STATUS: "status",
  AUDIT_COMMENT: "auditComment",
} as const;

export type ProcurementField =
  (typeof ProcurementField)[keyof typeof ProcurementField];

/**
 * 权限配置页只消费此清单；新增字段必须同时接入业务页权限消费后才能登记。
 */
export const procurementConfigurableFields = [
  {
    field: ProcurementField.ORDER_NO,
    label: "采购订单编号",
    isSensitive: false,
  },
  {
    field: ProcurementField.SUPPLIER_NAME,
    label: "供应商名称",
    isSensitive: false,
  },
  {
    field: ProcurementField.QUANTITY,
    label: "物料采购数量",
    isSensitive: false,
  },
  {
    field: ProcurementField.COST_PRICE,
    label: "采购成本单价",
    isSensitive: true,
  },
  {
    field: ProcurementField.STATUS,
    label: "订单审批状态",
    isSensitive: false,
  },
  {
    field: ProcurementField.AUDIT_COMMENT,
    label: "审核意见备注",
    isSensitive: false,
  },
] as const;

export const procurementCreateFields = [
  ProcurementField.SUPPLIER_NAME,
  ProcurementField.QUANTITY,
  ProcurementField.COST_PRICE,
] as const;

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
    fields: procurementConfigurableFields.map(({ field }) => field),
    actionMetadata: {
      read: {
        label: "查看采购订单",
        scopes: [
          DataScope.SELF,
          DataScope.DEPT,
          DataScope.DEPT_TREE,
          DataScope.ALL,
        ],
        fields: procurementConfigurableFields.map(({ field }) => field),
      },
      create: {
        label: "新建采购订单",
        fields: procurementCreateFields,
      },
      update: {
        label: "修改采购订单",
        scopes: [
          DataScope.SELF,
          DataScope.DEPT,
          DataScope.DEPT_TREE,
          DataScope.ALL,
        ],
        fields: procurementCreateFields,
      },
      audit: {
        label: "审核采购订单",
        scopes: [DataScope.DEPT, DataScope.DEPT_TREE, DataScope.ALL],
        fields: [ProcurementField.STATUS, ProcurementField.AUDIT_COMMENT],
      },
      export: {
        label: "导出采购订单",
        scopes: [
          DataScope.SELF,
          DataScope.DEPT,
          DataScope.DEPT_TREE,
          DataScope.ALL,
        ],
        fields: [
          ProcurementField.ORDER_NO,
          ProcurementField.SUPPLIER_NAME,
          ProcurementField.QUANTITY,
          ProcurementField.STATUS,
        ],
      },
    },
  },
} as const;

export type ProcurementAction = (typeof procurementOrderActions)[number];
export const ProcurementSubject = ProcurementPermission.order.subject;

/** 从同一受控字段契约推导列表/详情页的字段可见性。 */
export function getProcurementFieldVisibility(ability: {
  can(action: string, subject: string, field?: string): boolean;
}) {
  return {
    orderNo: ability.can("read", ProcurementSubject, ProcurementField.ORDER_NO),
    supplierName: ability.can(
      "read",
      ProcurementSubject,
      ProcurementField.SUPPLIER_NAME,
    ),
    quantity: ability.can(
      "read",
      ProcurementSubject,
      ProcurementField.QUANTITY,
    ),
    costPrice: ability.can(
      "read",
      ProcurementSubject,
      ProcurementField.COST_PRICE,
    ),
    status: ability.can("read", ProcurementSubject, ProcurementField.STATUS),
    auditComment: ability.can(
      "read",
      ProcurementSubject,
      ProcurementField.AUDIT_COMMENT,
    ),
  };
}

/** Better Auth 应用层组合入口。 */
export const procurementStatement = {
  [ProcurementPermission.order.resource]: ProcurementPermission.order.actions,
} as const;

/** CASL Resource -> Subject 映射入口。 */
export const procurementPermissionDefinition = ProcurementPermission.order;

export const ProcurementFields = {
  supplierName: ProcurementField.SUPPLIER_NAME,
  quantity: ProcurementField.QUANTITY,
  costPrice: ProcurementField.COST_PRICE,
} as const;

/** UI 中文展示元数据（仅用于管理页面渲染，非安全事实源）。 */
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
