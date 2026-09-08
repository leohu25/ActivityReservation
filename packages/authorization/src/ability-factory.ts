import { createMongoAbility, type MongoAbility } from "@casl/ability";
import type { TenantContext } from "@chenrun/auth";
import type {
  AuthorizationRepository,
  OrganizationRoleRecord,
} from "@chenrun/db-control";
import type {
  CatalogAction,
  CatalogSubject,
  PermissionCatalog,
  PermissionDefinition,
} from "./catalog";

export type AppAbility<
  TAction extends string,
  TSubject extends string,
> = MongoAbility<[TAction, TSubject]>;
export type RolePermissionStatement = Readonly<
  Record<string, readonly string[]>
>;

export interface AbilityFactoryOptions {
  staticRolePermissions?: Readonly<Record<string, RolePermissionStatement>>;
}

export class AbilityFactoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AbilityFactoryError";
  }
}

function parseMemberRoles(role: string): string[] {
  return [
    ...new Set(
      role
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function parsePersistedPermissions(
  record: OrganizationRoleRecord,
): RolePermissionStatement {
  let value: unknown;
  try {
    value = JSON.parse(record.permission);
  } catch {
    throw new AbilityFactoryError(
      `Role ${record.role} contains malformed permission JSON`,
    );
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AbilityFactoryError(
      `Role ${record.role} permissions must be an object`,
    );
  }

  const result: Record<string, readonly string[]> = {};
  for (const [resource, actions] of Object.entries(value)) {
    if (
      !Array.isArray(actions) ||
      actions.some((action) => typeof action !== "string")
    ) {
      throw new AbilityFactoryError(
        `Role ${record.role} contains invalid actions for ${resource}`,
      );
    }
    result[resource] = actions;
  }
  return result;
}

function validatePermission<
  const TDefinitions extends readonly PermissionDefinition[],
>(
  catalog: PermissionCatalog<TDefinitions>,
  role: string,
  statement: RolePermissionStatement,
): Array<{
  action: CatalogAction<TDefinitions>;
  subject: CatalogSubject<TDefinitions>;
}> {
  const grants: Array<{
    action: CatalogAction<TDefinitions>;
    subject: CatalogSubject<TDefinitions>;
  }> = [];
  for (const [resource, actions] of Object.entries(statement)) {
    const definition = catalog.resolve(resource);
    if (!definition) {
      throw new AbilityFactoryError(
        `Role ${role} references unknown resource ${resource}`,
      );
    }
    for (const action of actions) {
      if (!catalog.containsAction(definition, action)) {
        throw new AbilityFactoryError(
          `Role ${role} references unknown action ${resource}:${action}`,
        );
      }
      grants.push({ action, subject: definition.subject });
    }
  }
  return grants;
}

/**
 * Compiles Better Auth role statements into CASL rules for a trusted tenant.
 * No caller-supplied organization id or roles are accepted.
 */
export class CaslAbilityFactory<
  const TDefinitions extends readonly PermissionDefinition[],
> {
  constructor(
    private readonly repository: AuthorizationRepository,
    private readonly catalog: PermissionCatalog<TDefinitions>,
    private readonly options: AbilityFactoryOptions = {},
  ) {}

  async createForTenant(
    context: TenantContext,
  ): Promise<
    AppAbility<CatalogAction<TDefinitions>, CatalogSubject<TDefinitions>>
  > {
    const member = await this.repository.findMember(
      context.organizationId,
      context.user.id,
    );
    if (
      !member ||
      member.id !== context.member.id ||
      member.organizationId !== context.organizationId ||
      member.userId !== context.user.id
    ) {
      throw new AbilityFactoryError(
        "Trusted tenant membership could not be revalidated",
      );
    }

    const roleNames = parseMemberRoles(member.role);
    const persistedRoles = await this.repository.findOrganizationRoles(
      context.organizationId,
      roleNames,
    );
    const requestedRoles = new Set(roleNames);
    const byRole = new Map<string, OrganizationRoleRecord>();
    for (const record of persistedRoles) {
      if (
        record.organizationId !== context.organizationId ||
        !requestedRoles.has(record.role)
      ) {
        throw new AbilityFactoryError(
          "Authorization repository returned a cross-organization role",
        );
      }
      if (byRole.has(record.role)) {
        throw new AbilityFactoryError(
          `Duplicate role definition: ${record.role}`,
        );
      }
      byRole.set(record.role, record);
    }

    type CatalogAbility = AppAbility<
      CatalogAction<TDefinitions>,
      CatalogSubject<TDefinitions>
    >;
    const rules: Array<{ action: string; subject: string }> = [];
    const seen = new Set<string>();
    for (const roleName of roleNames) {
      const persisted = byRole.get(roleName);
      const statement = persisted
        ? parsePersistedPermissions(persisted)
        : this.options.staticRolePermissions?.[roleName];
      if (!statement) {
        continue;
      }
      for (const grant of validatePermission(
        this.catalog,
        roleName,
        statement,
      )) {
        const key = `${grant.action}\u0000${grant.subject}`;
        if (!seen.has(key)) {
          rules.push({ action: grant.action, subject: grant.subject });
          seen.add(key);
        }
      }
    }

    return createMongoAbility<[string, string]>(rules) as CatalogAbility;
  }
}
