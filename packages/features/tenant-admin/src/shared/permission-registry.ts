import {
  DataScope,
  type DataScopeType,
  type FeatureModulePermissionDescriptor,
  type FeaturePagePermissionDescriptor,
} from "@chenrun/authorization";

export type PagePermissionDescriptor = FeaturePagePermissionDescriptor;
export type ModulePermissionDescriptor = FeatureModulePermissionDescriptor;

export const DATA_SCOPE_SELECT_OPTIONS: Array<{
  value: DataScopeType;
  label: string;
  desc: string;
}> = [
  {
    value: DataScope.SELF,
    label: "仅本人",
    desc: "仅允许访问当前成员创建的数据",
  },
  {
    value: DataScope.DEPT,
    label: "本部门",
    desc: "允许访问当前成员所属部门的数据",
  },
  {
    value: DataScope.DEPT_TREE,
    label: "部门及下级",
    desc: "包含本部门以及所有下属分支部门数据",
  },
  {
    value: DataScope.ALL,
    label: "全租户",
    desc: "允许访问全租户组织全部数据",
  },
];
