/** 基于 CASL 的功能授权、数据范围 (Data Scope) 与字段策略 (Field Policy) 核心导出 */

export { StandardAction } from "./core/actions";
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
  filterNavSections,
  type FeatureNavItem,
  type FeatureNavGroup,
  type FeatureNavSection,
  type FeatureConfigurableField,
  type FeatureActionConfigItem,
  type FeaturePagePermissionDescriptor,
  type FeatureModulePermissionDescriptor,
  type TenantFeatureManifest,
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
  FieldPolicy,
  FieldPolicyError,
  getFieldMode,
  getFieldVisibility,
  getReadableFields,
  getEditableFields,
  pickReadableFields,
  type FieldAccessMode,
  type RoleFieldPolicyConfig,
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
} from "./adapters/react";
