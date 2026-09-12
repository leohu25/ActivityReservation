import {
  STANDARD_DATA_SCOPES,
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@chenrun/authorization";

export const MigrationManagementSubject = "ControlMigration";
export const MigrationManagementResource = "control.migration";

export const migrationManagementPageContract: FeaturePagePermissionDescriptor =
  {
    resource: MigrationManagementResource,
    subject: MigrationManagementSubject,
    label: "数据架构与迁移中枢",
    path: "/migrations",
    actions: [
      {
        action: StandardAction.READ,
        label: "查看架构与迁移看板",
        supportedScopes: STANDARD_DATA_SCOPES,
      },
      { action: "upgrade_platform", label: "升级平台控制数据库" },
      { action: "upgrade_fleet", label: "升级租户舰队数据库" },
    ],
    configurableFields: [],
  } as const;
