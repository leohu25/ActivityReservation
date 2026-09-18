import {
  STANDARD_DATA_SCOPES,
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@base/authorization";

export { StandardAction };

// 1. 实体与资源标识
export const ItemMasterSubject = "ItemMaster";
export type ItemMasterSubject = typeof ItemMasterSubject;
export const ItemMasterResource = "material.item_master";
export type ItemMasterResource = typeof ItemMasterResource;

// 2. 字段字典枚举
export const ItemMasterField = {
  ID: "id",
  ITEM_CODE: "itemCode",
  ITEM_NAME: "itemName",
  ITEM_ALIAS: "itemAlias",
  ITEM_CATEGORY: "itemCategory",
  CATEGORY_ID: "categoryId",
  VARIETY_ID: "varietyId",
  GRADE_ID: "gradeId",
  SUPPLY_MODE: "supplyMode",
  ITEM_TYPE: "itemType",
  ITEM_TAGS: "itemTags",
  BASE_UNIT: "baseUnit",
  PURCHASE_UNIT: "purchaseUnit",
  STOCK_UNIT: "stockUnit",
  PRODUCTION_UNIT: "productionUnit",
  SALES_UNIT: "salesUnit",
  MIN_PURCHASE_QTY: "minPurchaseQty",
  MIN_SALES_QTY: "minSalesQty",
  MAX_SALES_QTY: "maxSalesQty",
  QTY_PRECISION: "qtyPrecision",
  DEFAULT_SUPPLIER_ID: "defaultSupplierId",
  DEFAULT_WAREHOUSE_ID: "defaultWarehouseId",
  DEFAULT_ROUTE_CODE: "defaultRouteCode",
  SHELF_LIFE_HOURS: "shelfLifeHours",
  BATCH_MANAGED: "batchManaged",
  TEMPERATURE_ZONE: "temperatureZone",
  PROCESSING_FORM: "processingForm",
  FRESH_CUT_FLAG: "freshCutFlag",
  ACCEPTANCE_STANDARD: "acceptanceStandard",
  REFERENCE_PRICE: "referencePrice",
  STATUS: "status",
} as const;

// 3. 受控字段元数据定义
export const itemMasterConfigurableFields = [
  { field: ItemMasterField.ITEM_CODE, label: "物料编码", isSensitive: false },
  { field: ItemMasterField.ITEM_NAME, label: "物料名称", isSensitive: false },
  {
    field: ItemMasterField.ITEM_CATEGORY,
    label: "物料大类",
    isSensitive: false,
  },
  { field: ItemMasterField.SUPPLY_MODE, label: "供应方式", isSensitive: false },
  {
    field: ItemMasterField.BASE_UNIT,
    label: "基本核算单位",
    isSensitive: false,
  },
  {
    field: ItemMasterField.PURCHASE_UNIT,
    label: "采购单位",
    isSensitive: false,
  },
  { field: ItemMasterField.SALES_UNIT, label: "销售单位", isSensitive: false },
  {
    field: ItemMasterField.REFERENCE_PRICE,
    label: "参考行情价",
    isSensitive: true,
  },
  { field: ItemMasterField.STATUS, label: "在售状态", isSensitive: false },
] as const;

// 4. 自定义操作动作
export const ItemMasterAction = {
  ...StandardAction,
  TOGGLE_STATUS: "toggle_status",
} as const;

// 5. 页面级纯数据权限契约 (SSoT)
export const itemMasterPageContract: FeaturePagePermissionDescriptor = {
  resource: ItemMasterResource,
  subject: ItemMasterSubject,
  label: "商品档案管理",
  path: "/materials/items",
  actions: [
    {
      action: StandardAction.READ,
      label: "查看商品",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
    { action: StandardAction.CREATE, label: "新建商品" },
    {
      action: StandardAction.UPDATE,
      label: "修改商品",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
    { action: StandardAction.DELETE, label: "删除商品" },
    { action: StandardAction.EXPORT, label: "数据导出" },
    { action: ItemMasterAction.TOGGLE_STATUS, label: "启停售管理" },
  ],
  configurableFields: itemMasterConfigurableFields.map((f) => ({
    field: f.field,
    label: f.label,
    sensitive: f.isSensitive,
  })),
} as const;
