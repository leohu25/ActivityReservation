import {
  STANDARD_DATA_SCOPES,
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@base/authorization";
import { defineListSearchParams } from "@base/ui";
import { MasterDataStatus } from "@base/shared";

export { MasterDataStatus };

/**
 * 列表 URL 契约（少即是多）：page/pageSize/keyword 由基座约定，业务只扩展默认值。
 */
export const positionSearchParams = defineListSearchParams({
  status: "",
});
export type PositionSearchParams = Awaited<
  ReturnType<typeof positionSearchParams.parse>
>;

/** 岗位实体与资源标识 (SSoT) */
export const PositionSubject = "Position";
export type PositionSubject = typeof PositionSubject;
export const PositionResource = "organization.position";
export type PositionResource = typeof PositionResource;

export const PositionAction = {
  ...StandardAction,
  TOGGLE_STATUS: "toggle_status",
} as const;

/** 岗位受控字段字典 */
export const PositionField = {
  NAME: "name",
  CODE: "code",
  DESCRIPTION: "description",
  SORT: "sort",
  STATUS: "status",
} as const;

export type PositionField = (typeof PositionField)[keyof typeof PositionField];

/** 岗位受控字段元数据定义 */
export const positionConfigurableFields = [
  { field: PositionField.NAME, label: "岗位名称", isSensitive: false },
  { field: PositionField.CODE, label: "岗位编码", isSensitive: false },
  { field: PositionField.DESCRIPTION, label: "岗位描述", isSensitive: false },
  { field: PositionField.SORT, label: "排序权重", isSensitive: false },
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
    { action: StandardAction.UPDATE, label: "编辑" },
    { action: PositionAction.TOGGLE_STATUS, label: "启用/停用" },
    { action: StandardAction.DELETE, label: "删除" },
    { action: StandardAction.EXPORT, label: "导出岗位列表" },
  ],
  configurableFields: positionConfigurableFields.map((f) => ({
    field: f.field,
    label: f.label,
    sensitive: f.isSensitive,
  })),
} as const;
