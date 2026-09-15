/** 基于 CASL 的功能授权、数据范围 (Data Scope) 与字段策略 (Field Policy) 核心导出 */

export { StandardAction } from "./core/actions";
export {
  BUILT_IN_ROLES,
  type BuiltInRole,
  isBuiltInRole,
} from "./core/roles";
export {
  createPermissionCatalog,
  PermissionCatalog,
  PermissionCatalogError,
  type ActionMetadata,
  type CatalogAction,
  type CatalogSubject,
  type PermissionDefinition,
} from "./core/catalog";
export {
  deriveCatalogDefinitions,
  derivePermissionCatalog,
  deriveNavSections,
  derivePermissionTree,
  deriveMenuAlignedPermissionTree,
  buildMenuTree,
  filterNavSections,
  derivePageList,
  derivePageCatalog,
  pruneDynamicMenuTree,
  type FlatTenantMenuItemRecord,
  type FeatureNavItem,
  type FeatureNavGroup,
  type FeatureNavSection,
  type FeatureConfigurableField,
  type FeatureActionConfigItem,
  type FeaturePagePermissionDescriptor,
  type FeatureModulePermissionDescriptor,
  type TenantFeatureManifest,
  type StandardPageDescriptor,
  type TenantMenuNode,
} from "./core/manifest";

export {
  DataScope,
  DataScopeError,
  DEPT_DATA_SCOPES,
  resolveDataScopeConditions,
  STANDARD_DATA_SCOPES,
  type DataScopeFieldMapping,
  type DataScopeType,
  type PrismaQueryCondition,
  type RoleDataScopeConfig,
  type UserDepartmentTopology,
} from "./scopes/data-scope";

export {
  assertEditableFields,
  createSubjectAbility,
  FieldPolicy,
  FieldPolicyError,
  getFieldMode,
  getFieldVisibility,
  getReadableFields,
  getEditableFields,
  isFieldAllowedForAction,
  pickReadableFields,
  resolveFieldAccess,
  type FieldAccessMode,
  type RoleFieldPolicyConfig,
  type SubjectAbilityLike,
  type SubjectPermissionsPayload,
} from "./fields/field-policy";

export {
  AbilityFactoryError,
  CaslAbilityFactory,
  parsePersistedPermissions,
  serializeRolePermissions,
  type AbilityFactoryOptions,
  type AppAbility,
  type AppPrismaAbility,
  type ParsedRolePermissions,
  type RolePermissionPayload,
  type RolePermissionStatement,
} from "./ability/ability-factory";
export { getAccessibleWhere } from "./ability/prisma-access";

export {
  createServerAbilityAdapter,
  type AuthorizedInvocation,
} from "./adapters/server";
export {
  AbilityContext,
  createReactAbilityAdapter,
  useAbility,
  Can,
} from "./adapters/react";
export {
  createAbilityFromSnapshot,
  snapshotToRawRules,
  type AbilitySnapshot,
  type AppClientAbility,
} from "./adapters/client-ability";
export {
  TenantAbilityProvider,
  useOptionalAbility,
  useSubjectCan,
} from "./adapters/ability-provider";
