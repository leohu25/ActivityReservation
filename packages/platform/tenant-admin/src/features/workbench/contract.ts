import {
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@base/authorization";

export const WorkbenchResource = "system:workbench";
export const WorkbenchSubject = "Workbench";

export const WorkbenchAction = {
  ...StandardAction,
  VIEW_DEPT_STATS: "view_dept_stats",
  VIEW_ROLE_STATS: "view_role_stats",
  VIEW_CUSTOMER_STATS: "view_customer_stats",
  VIEW_CATEGORY_STATS: "view_category_stats",
  VIEW_TAGS: "view_tags",
  QUICK_ACTION: "quick_action",
} as const;

export type WorkbenchAction =
  (typeof WorkbenchAction)[keyof typeof WorkbenchAction];

/**
 * 工作台页面纯数据权限契约 (SSoT)
 * 采用 A (视图键细粒度动作控制) + B (多实体复合联动) 标准架构
 * 供角色权限管理树与动态菜单授权使用
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
    { action: WorkbenchAction.VIEW_CUSTOMER_STATS, label: "查看客户统计卡片" },
    { action: WorkbenchAction.VIEW_CATEGORY_STATS, label: "查看分类统计卡片" },
    { action: WorkbenchAction.VIEW_TAGS, label: "查看标签库看板" },
    { action: WorkbenchAction.QUICK_ACTION, label: "使用快捷操作通道" },
  ],
} as const;
