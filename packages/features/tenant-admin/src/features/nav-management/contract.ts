import {
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@base/authorization";

/** 导航菜单管理实体与资源标识 (SSoT) */
export const TenantMenuItemSubject = "TenantMenuItem";
export type TenantMenuItemSubject = typeof TenantMenuItemSubject;
export const TenantMenuItemResource = "system.menu_item";
export type TenantMenuItemResource = typeof TenantMenuItemResource;

/** 导航菜单管理受控字段字典 */
export const TenantMenuItemField = {
  ID: "id",
  PARENT_ID: "parentId",
  ITEM_TYPE: "itemType",
  PAGE_KEY: "pageKey",
  EXTERNAL_URL: "externalUrl",
  OPEN_IN_NEW_TAB: "openInNewTab",
  CUSTOM_LABEL: "customLabel",
  CUSTOM_ICON: "customIcon",
  SORT_ORDER: "sortOrder",
  IS_VISIBLE: "isVisible",
  CREATED_BY_ID: "createdById",
  DEPT_ID: "deptId",
  UPDATED_BY_ID: "updatedById",
  CREATED_AT: "createdAt",
  UPDATED_AT: "updatedAt",
  IS_DELETED: "isDeleted",
  DELETED_AT: "deletedAt",
  DELETED_BY_ID: "deletedById",
} as const;

export type TenantMenuItemField =
  (typeof TenantMenuItemField)[keyof typeof TenantMenuItemField];

/** 导航菜单管理受控字段元数据定义 */
export const tenantMenuItemConfigurableFields = [
  {
    field: TenantMenuItemField.PARENT_ID,
    label: "父级菜单",
    isSensitive: false,
  },
  {
    field: TenantMenuItemField.ITEM_TYPE,
    label: "节点类型",
    isSensitive: false,
  },
  {
    field: TenantMenuItemField.PAGE_KEY,
    label: "关联页面键名",
    isSensitive: false,
  },
  {
    field: TenantMenuItemField.EXTERNAL_URL,
    label: "外部链接地址",
    isSensitive: false,
  },
  {
    field: TenantMenuItemField.OPEN_IN_NEW_TAB,
    label: "新标签页打开",
    isSensitive: false,
  },
  {
    field: TenantMenuItemField.CUSTOM_LABEL,
    label: "显示别名",
    isSensitive: false,
  },
  {
    field: TenantMenuItemField.CUSTOM_ICON,
    label: "显示图标",
    isSensitive: false,
  },
  {
    field: TenantMenuItemField.SORT_ORDER,
    label: "排序序号",
    isSensitive: false,
  },
  {
    field: TenantMenuItemField.IS_VISIBLE,
    label: "是否可见",
    isSensitive: false,
  },
] as const;

/**
 * 导航菜单管理页面纯数据权限契约 (SSoT)
 */
export const tenantMenuItemPageContract: FeaturePagePermissionDescriptor = {
  resource: TenantMenuItemResource,
  subject: TenantMenuItemSubject,
  label: "导航菜单管理",
  path: "/settings/navigation",
  actions: [
    { action: StandardAction.READ, label: "查看菜单" },
    { action: StandardAction.UPDATE, label: "修改菜单配置" },
  ],
  configurableFields: tenantMenuItemConfigurableFields.map((f) => ({
    field: f.field,
    label: f.label,
    sensitive: f.isSensitive,
  })),
} as const;
