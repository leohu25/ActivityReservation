import {
  STANDARD_DATA_SCOPES,
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@base/authorization";
import type { SearchContract } from "@base/shared";

export { StandardAction };

// 1. 实体与资源标识 (CASL Subject & Resource)
export const ItemCategorySubject = "ItemCategory";
export type ItemCategorySubject = typeof ItemCategorySubject;
export const ItemCategoryResource = "material.item_category";
export type ItemCategoryResource = typeof ItemCategoryResource;

export const ItemVarietySubject = "ItemVariety";
export type ItemVarietySubject = typeof ItemVarietySubject;
export const ItemVarietyResource = "material.item_variety";
export type ItemVarietyResource = typeof ItemVarietyResource;

export const ItemGradeSubject = "ItemGrade";
export type ItemGradeSubject = typeof ItemGradeSubject;
export const ItemGradeResource = "material.item_grade";
export type ItemGradeResource = typeof ItemGradeResource;

// 2. 字段字典枚举
export const ItemCategoryField = {
  ID: "id",
  CATEGORY_CODE: "categoryCode",
  CATEGORY_NAME: "categoryName",
  PARENT_ID: "parentId",
  LEVEL: "level",
  SORT_ORDER: "sortOrder",
  STATUS: "status",
} as const;

export const ItemVarietyField = {
  ID: "id",
  VARIETY_CODE: "varietyCode",
  VARIETY_NAME: "varietyName",
  DESCRIPTION: "description",
  STATUS: "status",
} as const;

export const ItemGradeField = {
  ID: "id",
  GRADE_CODE: "gradeCode",
  GRADE_NAME: "gradeName",
  DESCRIPTION: "description",
  STATUS: "status",
} as const;

// 3. 受控字段元数据定义
export const itemCategoryConfigurableFields = [
  {
    field: ItemCategoryField.CATEGORY_CODE,
    label: "分类编码",
    isSensitive: false,
  },
  {
    field: ItemCategoryField.CATEGORY_NAME,
    label: "分类名称",
    isSensitive: false,
  },
  { field: ItemCategoryField.LEVEL, label: "分类层级", isSensitive: false },
  {
    field: ItemCategoryField.SORT_ORDER,
    label: "排序权重",
    isSensitive: false,
  },
  { field: ItemCategoryField.STATUS, label: "状态", isSensitive: false },
] as const;

export const itemGradeConfigurableFields = [
  {
    field: ItemGradeField.GRADE_CODE,
    label: "等级编码",
    isSensitive: false,
  },
  {
    field: ItemGradeField.GRADE_NAME,
    label: "等级名称",
    isSensitive: false,
  },
  {
    field: ItemGradeField.DESCRIPTION,
    label: "等级描述",
    isSensitive: false,
  },
  { field: ItemGradeField.STATUS, label: "状态", isSensitive: false },
] as const;

export const itemVarietyConfigurableFields = [
  {
    field: ItemVarietyField.VARIETY_CODE,
    label: "品种编码",
    isSensitive: false,
  },
  {
    field: ItemVarietyField.VARIETY_NAME,
    label: "品种名称",
    isSensitive: false,
  },
  {
    field: ItemVarietyField.DESCRIPTION,
    label: "品种描述",
    isSensitive: false,
  },
  { field: ItemVarietyField.STATUS, label: "状态", isSensitive: false },
] as const;

// 4. 自定义业务操作动作
export const ClassificationAction = {
  ...StandardAction,
  TOGGLE_STATUS: "toggle_status",
} as const;

// 5. 独立实体权限契约 (SSoT)。同页展示不等于共享 Subject。
const classificationActions = [
  {
    action: StandardAction.READ,
    label: "查看",
    supportedScopes: STANDARD_DATA_SCOPES,
  },
  { action: StandardAction.CREATE, label: "新建" },
  {
    action: StandardAction.UPDATE,
    label: "修改",
    supportedScopes: STANDARD_DATA_SCOPES,
  },
  { action: StandardAction.DELETE, label: "删除" },
  { action: ClassificationAction.TOGGLE_STATUS, label: "启用/停用" },
] as const;

export const itemCategoryPageContract: FeaturePagePermissionDescriptor = {
  resource: ItemCategoryResource,
  subject: ItemCategorySubject,
  label: "商品分类",
  path: "/materials/categories",
  actions: classificationActions,
  configurableFields: itemCategoryConfigurableFields.map((f) => ({
    field: f.field,
    label: f.label,
    sensitive: f.isSensitive,
  })),
} as const;

export const itemVarietyPageContract: FeaturePagePermissionDescriptor = {
  resource: ItemVarietyResource,
  subject: ItemVarietySubject,
  label: "商品品种",
  path: "/materials/categories",
  actions: classificationActions,
  configurableFields: itemVarietyConfigurableFields.map((f) => ({
    field: f.field,
    label: f.label,
    sensitive: f.isSensitive,
  })),
} as const;

export const itemGradePageContract: FeaturePagePermissionDescriptor = {
  resource: ItemGradeResource,
  subject: ItemGradeSubject,
  label: "商品等级",
  path: "/materials/categories",
  actions: classificationActions,
  configurableFields: itemGradeConfigurableFields.map((f) => ({
    field: f.field,
    label: f.label,
    sensitive: f.isSensitive,
  })),
} as const;

/** 商品分类搜索契约 */
export const itemCategorySearchContract: SearchContract = {
  direct: [
    { field: "categoryCode", label: "分类编码" },
    { field: "categoryName", label: "分类名称" },
  ],
} as const;

/** 商品品种搜索契约 */
export const itemVarietySearchContract: SearchContract = {
  direct: [
    { field: "varietyCode", label: "品种编码" },
    { field: "varietyName", label: "品种名称" },
    { field: "description", label: "描述" },
  ],
} as const;

/** @deprecated Use the independent entity descriptors above. */
export const categoryClassificationPageContract = itemCategoryPageContract;
