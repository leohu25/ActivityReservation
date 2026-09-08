/** CASL functional authorization compiled from Better Auth organization roles. */

export {
  AbilityFactoryError,
  CaslAbilityFactory,
  type AbilityFactoryOptions,
  type AppAbility,
  type RolePermissionStatement,
} from "./ability-factory";
export {
  createPermissionCatalog,
  PermissionCatalog,
  PermissionCatalogError,
  type CatalogAction,
  type CatalogSubject,
  type PermissionDefinition,
} from "./catalog";
export {
  createServerAbilityAdapter,
  type AuthorizedInvocation,
} from "./server";
