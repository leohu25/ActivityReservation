import {
  STANDARD_DATA_SCOPES,
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@base/authorization";

export const TenantManagementSubject = "ControlTenant";
export const TenantManagementResource = "control.tenant";

export const TenantManagementField = {
  NAME: "name",
  SLUG: "slug",
  DATABASE_NAME: "databaseName",
  CLUSTER_CODE: "clusterCode",
  SCHEMA_VERSION: "schemaVersion",
  STATUS: "status",
  MEMBER_COUNT: "memberCount",
  CREATED_AT: "createdAt",
} as const;

export const tenantManagementPageContract: FeaturePagePermissionDescriptor = {
  resource: TenantManagementResource,
  subject: TenantManagementSubject,
  label: "租户与物理库运维中枢",
  path: "/tenants",
  actions: [
    {
      action: StandardAction.READ,
      label: "查看租户与物理库列表",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
    { action: StandardAction.CREATE, label: "开通新租户与独立库 (Provision)" },
    { action: StandardAction.UPDATE, label: "启停挂起物理库管控" },
    { action: "reset_password", label: "重置租户成员与管理员密码" },
  ],
  configurableFields: [
    { field: TenantManagementField.NAME, label: "租户全称", sensitive: false },
    {
      field: TenantManagementField.SLUG,
      label: "租户Slug标识",
      sensitive: false,
    },
    {
      field: TenantManagementField.DATABASE_NAME,
      label: "物理数据库名",
      sensitive: true,
    },
    {
      field: TenantManagementField.CLUSTER_CODE,
      label: "部署集群代码",
      sensitive: true,
    },
    {
      field: TenantManagementField.SCHEMA_VERSION,
      label: "迁移版本号",
      sensitive: false,
    },
    {
      field: TenantManagementField.STATUS,
      label: "物理库状态",
      sensitive: false,
    },
  ],
} as const;
