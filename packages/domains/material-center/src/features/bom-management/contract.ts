import {
  STANDARD_DATA_SCOPES,
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@base/authorization";
import type { SearchContract } from "@base/shared";

export { StandardAction };

// 1. 实体与资源标识
export const BomHeaderSubject = "BomHeader";
export type BomHeaderSubject = typeof BomHeaderSubject;
export const BomHeaderResource = "material.bom";
export type BomHeaderResource = typeof BomHeaderResource;

export const ProcessMasterSubject = "ProcessMaster";
export type ProcessMasterSubject = typeof ProcessMasterSubject;
export const ProcessMasterResource = "material.process";
export type ProcessMasterResource = typeof ProcessMasterResource;

export const ProductionLineSubject = "ProductionLine";
export type ProductionLineSubject = typeof ProductionLineSubject;
export const ProductionLineResource = "material.production_line";
export type ProductionLineResource = typeof ProductionLineResource;

export const ProcessMasterField = {
  PROCESS_CODE: "processCode",
  PROCESS_NAME: "processName",
  CATEGORY: "category",
  DEFAULT_LOSS_RATE: "defaultLossRate",
  MIN_BATCH_QTY: "minBatchQty",
  STD_LABOR_HOURS: "stdLaborHours",
  STATUS: "status",
} as const;

export const ProductionLineField = {
  LINE_CODE: "lineCode",
  LINE_NAME: "lineName",
  DESCRIPTION: "description",
  STATUS: "status",
} as const;

// 2. 字段字典枚举
export const BomHeaderField = {
  ID: "id",
  BOM_CODE: "bomCode",
  BOM_NAME: "bomName",
  BOM_TYPE: "bomType",
  VERSION: "version",
  IS_RESEARCH: "isResearch",
  IS_DEFAULT: "isDefault",
  OUTPUT_ITEM_CODE: "outputItemCode",
  BATCH_QTY: "batchQty",
  BATCH_UNIT: "batchUnit",
  PRODUCTION_LINE_ID: "productionLineId",
  ROUTE_CODE: "routeCode",
  OVERRIDE_TOTAL_YIELD: "overrideTotalYield",
  TOTAL_YIELD_RATE: "totalYieldRate",
  STATUS: "status",
  EFFECTIVE_DATE: "effectiveDate",
  REMARK: "remark",
} as const;

// 3. 受控字段元数据定义
export const bomHeaderConfigurableFields = [
  { field: BomHeaderField.BOM_CODE, label: "BOM编号", isSensitive: false },
  { field: BomHeaderField.BOM_NAME, label: "BOM名称", isSensitive: false },
  { field: BomHeaderField.BOM_TYPE, label: "BOM类型", isSensitive: false },
  { field: BomHeaderField.VERSION, label: "版本号", isSensitive: false },
  {
    field: BomHeaderField.OUTPUT_ITEM_CODE,
    label: "产出物料",
    isSensitive: false,
  },
  {
    field: BomHeaderField.TOTAL_YIELD_RATE,
    label: "综合出成率(%)",
    isSensitive: false,
  },
  { field: BomHeaderField.STATUS, label: "状态", isSensitive: false },
] as const;

// 4. 自定义操作动作 (含发布流状态机)
export const BomAction = {
  ...StandardAction,
  SUBMIT_REVIEW: "submit_review", // 提交评审
  PUBLISH: "publish", // 审核发布 (生成生产不可变版本)
  ARCHIVE: "archive", // 归档停用
  CREATE_NEW_VERSION: "create_new_version", // 另存新版本
  OVERRIDE_MRP: "override_mrp", // MRP运行时临时策略覆盖
} as const;

// 5. 页面级纯数据权限契约 (SSoT)
export const processMasterPageContract: FeaturePagePermissionDescriptor = {
  resource: ProcessMasterResource,
  subject: ProcessMasterSubject,
  label: "工序模板",
  path: "/materials/boms",
  actions: [{ action: StandardAction.READ, label: "查看工序模板" }],
  configurableFields: Object.values(ProcessMasterField).map((field) => ({
    field,
    label: field,
    sensitive: false,
  })),
} as const;

export const productionLinePageContract: FeaturePagePermissionDescriptor = {
  resource: ProductionLineResource,
  subject: ProductionLineSubject,
  label: "生产线",
  path: "/materials/boms",
  actions: [{ action: StandardAction.READ, label: "查看生产线" }],
  configurableFields: Object.values(ProductionLineField).map((field) => ({
    field,
    label: field,
    sensitive: false,
  })),
} as const;

export const bomManagementPageContract: FeaturePagePermissionDescriptor = {
  resource: BomHeaderResource,
  subject: BomHeaderSubject,
  label: "工艺BOM与工序管理",
  path: "/materials/boms",
  actions: [
    {
      action: StandardAction.READ,
      label: "查看BOM",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
    { action: StandardAction.CREATE, label: "新建BOM/工序" },
    {
      action: StandardAction.UPDATE,
      label: "编辑BOM/工序",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
    { action: StandardAction.DELETE, label: "删除BOM" },
    { action: BomAction.SUBMIT_REVIEW, label: "提交评审" },
    { action: BomAction.PUBLISH, label: "发布生产版本" },
    { action: BomAction.ARCHIVE, label: "归档BOM" },
    { action: BomAction.CREATE_NEW_VERSION, label: "另存新版本" },
    { action: BomAction.OVERRIDE_MRP, label: "MRP策略调整" },
  ],
  configurableFields: bomHeaderConfigurableFields.map((f) => ({
    field: f.field,
    label: f.label,
    sensitive: f.isSensitive,
  })),
} as const;

/** 工艺BOM搜索契约 (SSoT) */
export const bomHeaderSearchContract: SearchContract = {
  direct: [
    { field: "bomCode", label: "BOM编码" },
    { field: "bomName", label: "BOM名称" },
    { field: "outputItemCode", label: "产出物料" },
  ],
} as const;
