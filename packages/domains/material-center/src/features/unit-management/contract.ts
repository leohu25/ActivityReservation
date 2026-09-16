import {
  STANDARD_DATA_SCOPES,
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@base/authorization";
import type { SearchContract } from "@base/shared";

export { StandardAction };

// 1. 实体与资源标识
export const UnitOfMeasureSubject = "UnitOfMeasure";
export type UnitOfMeasureSubject = typeof UnitOfMeasureSubject;
export const UnitOfMeasureResource = "material.unit";
export type UnitOfMeasureResource = typeof UnitOfMeasureResource;

export const UnitConversionSubject = "UnitConversion";
export type UnitConversionSubject = typeof UnitConversionSubject;
export const UnitConversionResource = "material.conversion";
export type UnitConversionResource = typeof UnitConversionResource;

// 2. 字段枚举
export const UnitOfMeasureField = {
  ID: "id",
  UNIT_CODE: "unitCode",
  UNIT_NAME: "unitName",
  UNIT_TYPE: "unitType",
  BASE_RATIO: "baseRatio",
  IS_BASE_UNIT: "isBaseUnit",
  STATUS: "status",
} as const;

export const UnitConversionField = {
  ID: "id",
  ITEM_CODE: "itemCode",
  FROM_UNIT_ID: "fromUnitId",
  TO_UNIT_ID: "toUnitId",
  CONVERSION_RATE: "conversionRate",
} as const;

// 3. 受控字段定义
export const unitConversionConfigurableFields = [
  {
    field: UnitConversionField.ITEM_CODE,
    label: "商品编码",
    isSensitive: false,
  },
  {
    field: UnitConversionField.FROM_UNIT_ID,
    label: "来源单位",
    isSensitive: false,
  },
  {
    field: UnitConversionField.TO_UNIT_ID,
    label: "目标单位",
    isSensitive: false,
  },
  {
    field: UnitConversionField.CONVERSION_RATE,
    label: "换算率",
    isSensitive: false,
  },
] as const;

export const unitConfigurableFields = [
  {
    field: UnitOfMeasureField.UNIT_CODE,
    label: "单位编码",
    isSensitive: false,
  },
  {
    field: UnitOfMeasureField.UNIT_NAME,
    label: "单位名称",
    isSensitive: false,
  },
  {
    field: UnitOfMeasureField.UNIT_TYPE,
    label: "度量类型",
    isSensitive: false,
  },
  {
    field: UnitOfMeasureField.BASE_RATIO,
    label: "基准折算率",
    isSensitive: false,
  },
  {
    field: UnitOfMeasureField.IS_BASE_UNIT,
    label: "是否基准单位",
    isSensitive: false,
  },
  { field: UnitOfMeasureField.STATUS, label: "状态", isSensitive: false },
] as const;

// 4. 自定义动作
export const UnitManagementAction = {
  ...StandardAction,
  CONFIGURE_CONVERSION: "configure_conversion",
} as const;

// 5. 页面契约
export const unitManagementPageContract: FeaturePagePermissionDescriptor = {
  resource: UnitOfMeasureResource,
  subject: UnitOfMeasureSubject,
  label: "计量单位",
  path: "/materials/units",
  actions: [
    {
      action: StandardAction.READ,
      label: "查看单位",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
    { action: StandardAction.CREATE, label: "新建单位" },
    {
      action: StandardAction.UPDATE,
      label: "修改单位",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
    { action: StandardAction.DELETE, label: "删除单位" },
  ],
  configurableFields: unitConfigurableFields.map((f) => ({
    field: f.field,
    label: f.label,
    sensitive: f.isSensitive,
  })),
} as const;

export const unitConversionPageContract: FeaturePagePermissionDescriptor = {
  resource: UnitConversionResource,
  subject: UnitConversionSubject,
  label: "多单位换算",
  path: "/materials/units",
  actions: [
    { action: StandardAction.READ, label: "查看换算" },
    {
      action: UnitManagementAction.CONFIGURE_CONVERSION,
      label: "配置专属换算",
    },
  ],
  configurableFields: unitConversionConfigurableFields.map((f) => ({
    field: f.field,
    label: f.label,
    sensitive: f.isSensitive,
  })),
} as const;

/** 计量单位搜索契约 */
export const unitOfMeasureSearchContract: SearchContract = {
  direct: [
    { field: "unitCode", label: "单位编码" },
    { field: "unitName", label: "单位名称" },
  ],
} as const;

/** 单位换算搜索契约 */
export const unitConversionSearchContract: SearchContract = {
  direct: [
    { field: "itemCode", label: "物料编码" },
    { field: "fromUnitName", label: "源单位" },
    { field: "toUnitName", label: "目标单位" },
  ],
} as const;
