import { DataScope, type DataScopeType } from "@chenrun/authorization";

/** 权限动作配置项模型 */
export interface ActionConfigItem {
  readonly action: string;
  readonly label: string;
  readonly supportedScopes?: readonly DataScopeType[];
}

/** 受控页面/实体模型 */
export interface PagePermissionDescriptor {
  readonly resource: string;
  readonly subject: string;
  readonly label: string;
  readonly path?: string;
  readonly actions: readonly ActionConfigItem[];
  readonly configurableFields?: readonly {
    readonly field: string;
    readonly label: string;
    readonly sensitive?: boolean;
  }[];
}

/** 业务顶级模块（对应侧边栏主分类/主菜单分组）模型 */
export interface ModulePermissionDescriptor {
  readonly moduleKey: string;
  readonly label: string;
  readonly iconName: string;
  readonly pages: readonly PagePermissionDescriptor[];
}

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
