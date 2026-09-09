import {
 DEPT_DATA_SCOPES,
 getFieldVisibility,
 STANDARD_DATA_SCOPES,
 StandardAction,
} from "@chenrun/authorization";

/**
 * ============================================================================
 * 采购中心权限最佳实践与标准规范模板
 * ============================================================================
 * 整个权限系统的闭环流转遵循清晰的六步生命周期：
 *
 * 【步骤 1：领域实体与受控字段定义】
 *   声明业务实体状态枚举与需要进行权限/字段控制的字段清单。
 *
 * 【步骤 2：受控动作与自描述元数据声明 (Catalog)】
 *   定义面向配置的 Resource、面向 ORM 的 Subject，并为每个 Action 配置其支持的
 *   数据范围 (Scopes) 和敏感字段清单 (Fields)。
 *
 * 【步骤 3：CASL 契约导出与类型推导】
 *   导出 Subject 运行时标识及 Action 联合类型，向全局 Ability Factory 提供注册定义。
 *
 * 【步骤 4：前端视图层便捷消费工具】
 *   基于 CASL Ability 派生页面字段可见性对象，简化 React 组件模板逻辑。
 *
 * 【步骤 5：服务端数据行级过滤 (Data Scope)】
 *   在 Service 查询层通过 getAccessibleWhere(ability, Subject, 'read') 生成 Prisma 查询条件。
 *
 * 【步骤 6：服务端数据列级脱敏 (Field Policy)】
 *   在 Service 出口层通过 pickReadableFields(ability, Subject, entity) 执行敏感字段脱敏。
 * ============================================================================
 */

// ============================================================================
// 【步骤 1：领域实体与受控字段定义】
// ============================================================================

/** 采购订单状态枚举，内聚于采购中心领域。 */
export const ProcurementOrderStatus = {
 PENDING: "PENDING",
 APPROVED: "APPROVED",
 REJECTED: "REJECTED",
} as const;

export type ProcurementOrderStatus =
 (typeof ProcurementOrderStatus)[keyof typeof ProcurementOrderStatus];

/** 采购单全部受控字段常量 */
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
 * 权限配置中心 (RolePermissionManager) 消费的字段清单。
 * 明确每个字段的展示标签以及是否为敏感字段（敏感字段在无读取权限时会自动脱敏为 ***）。
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
  isSensitive: true, // 核心敏感字段：采购员/普通员工默认脱敏遮罩
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

/** 允许在新建/编辑表单中提交的受控字段白名单 */
export const procurementCreateFields = [
 ProcurementField.SUPPLIER_NAME,
 ProcurementField.QUANTITY,
 ProcurementField.COST_PRICE,
] as const;

// ============================================================================
// 【步骤 2：受控动作与自描述元数据声明 (Catalog)】
// ============================================================================

/** 采购领域特定操作动作（继承平台 StandardAction 并扩展审批业务动作） */
export const ProcurementAction = {
 ...StandardAction,
 AUDIT: "audit",
} as const;

/** 采购订单支持的操作动作集合 */
const procurementOrderActions = [
 StandardAction.READ,
 StandardAction.CREATE,
 StandardAction.UPDATE,
 ProcurementAction.AUDIT,
 StandardAction.EXPORT,
] as const;

/**
 * 采购模块权限自描述元数据 (Permission Definition)
 *
 * 核心设计约定：
 * 1. resource: "procurement.order"
 *    面向 Better Auth / 租户权限管理后台的资源标识（展示在菜单与配置树上）。
 * 2. subject: "PurchaseOrder"
 *    面向 CASL Ability / Prisma ORM 的实体标识（映射到具体的数据库模型）。
 * 3. actionMetadata:
 *    自描述每个操作动作所支持的数据范围类型 (scopes) 与涉及的字段列表 (fields)。
 *    配置管理页面依据此元数据动态渲染下拉框与字段策略矩阵。
 */
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
    scopes: STANDARD_DATA_SCOPES,
    fields: procurementConfigurableFields.map(({ field }) => field),
   },
   create: {
    label: "新建采购订单",
    fields: procurementCreateFields,
   },
   update: {
    label: "修改采购订单",
    scopes: STANDARD_DATA_SCOPES,
    fields: procurementCreateFields,
   },
   audit: {
    label: "审核采购订单",
    scopes: DEPT_DATA_SCOPES,
    fields: [ProcurementField.STATUS, ProcurementField.AUDIT_COMMENT],
   },
   export: {
    label: "导出采购订单",
    scopes: STANDARD_DATA_SCOPES,
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

// ============================================================================
// 【步骤 3：CASL 契约导出与类型推导】
// ============================================================================

/** 采购单支持的操作动作强类型联合 */
export type ProcurementAction = (typeof procurementOrderActions)[number];

/** 采购单在 CASL 运行时的实体 Subject 标识（即 "PurchaseOrder"） */
export const ProcurementSubject = ProcurementPermission.order.subject;

/** 导出给全局 Ability Factory 与 Permission Catalog 注册的契约定义 */
export const procurementPermissionDefinition = ProcurementPermission.order;

// ============================================================================
// 【步骤 4：前端视图层便捷消费工具】
// ============================================================================

/**
 * 从当前用户的 CASL Ability 派生出列表/详情视图的字段级读取权限字典。
 * 前端组件可以直接解构使用：const { costPrice } = getProcurementFieldVisibility(ability);
 * 内部委托给通用的 getFieldVisibility，彻底消除手写循环判定。
 */
export function getProcurementFieldVisibility(ability: {
 can(action: string, subject: string, field?: string): boolean;
}) {
 return getFieldVisibility(
  ability,
  ProcurementSubject,
  Object.values(ProcurementField),
 );
}
