/** 基于 CASL 的功能授权、数据范围 (Data Scope) 与字段策略 (Field Policy) 核心导出 */

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
} from "./ability-factory";
export {
  createPermissionCatalog,
  PermissionCatalog,
  PermissionCatalogError,
  type ActionMetadata,
  type CatalogAction,
  type CatalogSubject,
  type PermissionDefinition,
} from "./catalog";
export {
  createServerAbilityAdapter,
  type AuthorizedInvocation,
} from "./server";
export {
  DataScopeError,
  resolveDataScopeConditions,
  type DataScopeFieldMapping,
  type DataScopeType,
  type PrismaQueryCondition,
  type RoleDataScopeConfig,
  type UserDepartmentTopology,
} from "./data-scope";
export {
  assertEditableFields,
  FieldPolicyError,
  getFieldMode,
  getReadableFields,
  getEditableFields,
  pickReadableFields,
  type FieldAccessMode,
  type RoleFieldPolicyConfig,
} from "./field-policy";
export { getAccessibleWhere } from "./prisma-access";
export {
  AbilityContext,
  createReactAbilityAdapter,
  useAbility,
} from "./react";
