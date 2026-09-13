import {
  STANDARD_DATA_SCOPES,
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@base/authorization";

/** Non-entity capability: platform and tenant-fleet migration operations. */
export const MigrationManagementSubject = "ControlMigration";
export type MigrationManagementSubject = typeof MigrationManagementSubject;
export const MigrationManagementResource = "control.migration";
export type MigrationManagementResource = typeof MigrationManagementResource;

export const MigrationManagementAction = {
  ...StandardAction,
  UPGRADE_PLATFORM: "upgrade_platform",
  UPGRADE_FLEET: "upgrade_fleet",
} as const;

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
      {
        action: MigrationManagementAction.UPGRADE_PLATFORM,
        label: "升级平台控制数据库",
      },
      {
        action: MigrationManagementAction.UPGRADE_FLEET,
        label: "升级租户舰队数据库",
      },
    ],
    configurableFields: [],
  } as const;
