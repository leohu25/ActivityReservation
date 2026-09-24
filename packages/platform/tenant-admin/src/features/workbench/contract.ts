import {
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@base/authorization";

export const WorkbenchResource = "system.workbench";
export const WorkbenchSubject = "Workbench";
export type WorkbenchSubject = typeof WorkbenchSubject;

export const WorkbenchAction = {
  ...StandardAction,
  VIEW_DEPT_STATS: "view_dept_stats",
  VIEW_ROLE_STATS: "view_role_stats",
  QUICK_ACTION: "quick_action",
} as const;

export type WorkbenchAction =
  (typeof WorkbenchAction)[keyof typeof WorkbenchAction];

/**
 * 工作台页面纯数据权限契约 (SSoT)
 * 供系统设置角色权限管理与动态菜单授权使用
 */
export const workbenchPageContract: FeaturePagePermissionDescriptor = {
  resource: WorkbenchResource,
  subject: WorkbenchSubject,
  label: "系统工作台",
  path: "/workbench",
  actions: [
    { action: WorkbenchAction.READ, label: "进入工作台" },
    { action: WorkbenchAction.VIEW_DEPT_STATS, label: "查看部门统计卡片" },
    { action: WorkbenchAction.VIEW_ROLE_STATS, label: "查看角色统计卡片" },
    { action: WorkbenchAction.QUICK_ACTION, label: "使用快捷操作通道" },
  ],
} as const;
