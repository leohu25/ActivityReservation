import {
  STANDARD_DATA_SCOPES,
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@chenrun/authorization";

/** 岗位实体与资源标识 (SSoT) */
export const PositionSubject = "Position";
export const PositionResource = "organization.position";

/** 岗位受控字段字典 */
export const PositionField = {
  NAME: "name",
  CODE: "code",
  LEVEL: "level",
  DEPARTMENT_ID: "departmentId",
  STATUS: "status",
} as const;

export type PositionField = (typeof PositionField)[keyof typeof PositionField];

/** 岗位受控字段元数据定义 */
export const positionConfigurableFields = [
  { field: PositionField.NAME, label: "岗位名称", isSensitive: false },
  { field: PositionField.CODE, label: "岗位编码", isSensitive: false },
  { field: PositionField.LEVEL, label: "职级等级", isSensitive: false },
  { field: PositionField.DEPARTMENT_ID, label: "所属部门", isSensitive: false },
  { field: PositionField.STATUS, label: "岗位状态", isSensitive: false },
] as const;

/**
 * 岗位管理页面纯数据权限契约 (SSoT)
 */
export const positionPageContract: FeaturePagePermissionDescriptor = {
  resource: PositionResource,
  subject: PositionSubject,
  label: "岗位管理",
  path: "/organization/positions",
  actions: [
    {
      action: StandardAction.READ,
      label: "查看",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
    { action: StandardAction.CREATE, label: "新建" },
    {
      action: StandardAction.UPDATE,
      label: "编辑",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
    { action: StandardAction.DELETE, label: "删除" },
  ],
  configurableFields: positionConfigurableFields.map((f) => ({
    field: f.field,
    label: f.label,
    sensitive: f.isSensitive,
  })),
} as const;
