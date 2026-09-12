import {
  STANDARD_DATA_SCOPES,
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@chenrun/authorization";

/** 部门实体与资源标识 (SSoT) */
export const DepartmentSubject = "Department";
export const DepartmentResource = "organization.department";

/** 部门受控字段字典 */
export const DepartmentField = {
  NAME: "name",
  CODE: "code",
  PARENT_ID: "parentId",
  LEADER_ID: "leaderId",
  ORDER_NUM: "orderNum",
  STATUS: "status",
} as const;

export type DepartmentField =
  (typeof DepartmentField)[keyof typeof DepartmentField];

/** 部门受控字段元数据定义 */
export const departmentConfigurableFields = [
  { field: DepartmentField.NAME, label: "部门名称", isSensitive: false },
  { field: DepartmentField.CODE, label: "部门编码", isSensitive: false },
  { field: DepartmentField.PARENT_ID, label: "上级部门", isSensitive: false },
  { field: DepartmentField.LEADER_ID, label: "部门负责人", isSensitive: false },
  { field: DepartmentField.ORDER_NUM, label: "排序序号", isSensitive: false },
  { field: DepartmentField.STATUS, label: "部门状态", isSensitive: false },
] as const;

/**
 * 部门管理页面纯数据权限契约 (SSoT)
 */
export const departmentPageContract: FeaturePagePermissionDescriptor = {
  resource: DepartmentResource,
  subject: DepartmentSubject,
  label: "部门管理",
  path: "/organization/departments",
  actions: [
    {
      action: StandardAction.READ,
      label: "查看",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
    { action: StandardAction.CREATE, label: "新建" },
    {
      action: StandardAction.UPDATE,
      label: "调整部门",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
    { action: StandardAction.DELETE, label: "撤销部门" },
  ],
  configurableFields: departmentConfigurableFields.map((f) => ({
    field: f.field,
    label: f.label,
    sensitive: f.isSensitive,
  })),
} as const;
