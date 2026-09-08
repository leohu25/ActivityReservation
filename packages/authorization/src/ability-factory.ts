import { createMongoAbility, type MongoAbility } from "@casl/ability";
import { createPrismaAbility, type PrismaAbility } from "@casl/prisma";
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
import {
  type RoleDataScopeConfig,
  type UserDepartmentTopology,
  type DataScopeFieldMapping,
  type PrismaQueryCondition,
  resolveDataScopeConditions,
} from "./data-scope";
import type { RoleFieldPolicyConfig } from "./field-policy";

export type AppAbility<
  TAction extends string,
  TSubject extends string,
> = MongoAbility<[TAction, TSubject]>;

export type AppPrismaAbility<
  TAction extends string,
  TSubject extends string,
> = PrismaAbility<[TAction, TSubject]>;

export type RolePermissionStatement = Readonly<
  Record<string, readonly string[]>
>;

export interface AbilityFactoryOptions {
  staticRolePermissions?: Readonly<Record<string, RolePermissionStatement>>;
  /**
   * 角色的数据范围扩展配置
   */
  dataScopes?: readonly RoleDataScopeConfig[];
  /**
   * 角色的字段策略扩展配置
   */
  fieldPolicies?: readonly RoleFieldPolicyConfig[];
  /**
   * 数据范围的默认实体字段映射
   */
  fieldMapping?: DataScopeFieldMapping;
}

export class AbilityFactoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AbilityFactoryError";
  }
}

interface IntermediateRule {
  action: string;
  subject: string;
  fields?: string[];
  conditions?: PrismaQueryCondition;
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
  resource: string;
}> {
  const grants: Array<{
    action: CatalogAction<TDefinitions>;
    subject: CatalogSubject<TDefinitions>;
    resource: string;
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
      grants.push({ action, subject: definition.subject, resource });
    }
  }
  return grants;
}

/**
 * 根据动作和字段策略计算允许的字段列表。
 * 对于读操作 (read)，允许 READONLY 和 EDITABLE；
 * 对于写操作 (create / update)，严格只允许 EDITABLE；
 * 其余非写非读操作，只要不是 HIDDEN 均允许。
 */
function computeAllowedFields(
  action: string,
  policies: readonly RoleFieldPolicyConfig[],
): string[] {
  return policies.flatMap((p) => {
    if (action === "read") {
      return p.access === "READONLY" || p.access === "EDITABLE"
        ? [p.field]
        : [];
    }
    if (action === "update" || action === "create") {
      return p.access === "EDITABLE" ? [p.field] : [];
    }
    return p.access === "HIDDEN" ? [] : [p.field];
  });
}

/**
 * 将 Better Auth 角色语句、数据范围 (Data Scope) 与字段策略 (Field Policy) 编译为 CASL 规则。
 * 强制重验租户成员身份，不接受任何外部伪造的 organizationId 或角色列表。
 */
export class CaslAbilityFactory<
  const TDefinitions extends readonly PermissionDefinition[],
> {
  constructor(
    private readonly repository: AuthorizationRepository,
    private readonly catalog: PermissionCatalog<TDefinitions>,
    private readonly options: AbilityFactoryOptions = {},
  ) {}

  private async resolveRolesAndStatements(context: TenantContext) {
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

    return { roleNames, byRole };
  }

  /**
   * 构建纯功能层面的 CASL Ability（用于 UI 元素显示控制与轻量级服务端守卫）。
   */
  async createForTenant(
    context: TenantContext,
  ): Promise<
    AppAbility<CatalogAction<TDefinitions>, CatalogSubject<TDefinitions>>
  > {
    const { roleNames, byRole } = await this.resolveRolesAndStatements(context);

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

  /**
   * 构建包含数据范围条件与字段策略的 PrismaAbility。
   * 可直接由 @casl/prisma accessibleBy 消费，将数据过滤下推至数据库 SQL 查询中。
   */
  async createPrismaAbilityForTenant(
    context: TenantContext,
    topology: UserDepartmentTopology,
    options?: {
      dataScopes?: readonly RoleDataScopeConfig[];
      fieldPolicies?: readonly RoleFieldPolicyConfig[];
      fieldMapping?: DataScopeFieldMapping;
    },
  ): Promise<
    AppPrismaAbility<CatalogAction<TDefinitions>, CatalogSubject<TDefinitions>>
  > {
    const { roleNames, byRole } = await this.resolveRolesAndStatements(context);
    const activeRoles = new Set(roleNames);

    const mergedDataScopes = [
      ...(this.options.dataScopes ?? []),
      ...(options?.dataScopes ?? []),
    ].filter((s) => activeRoles.has(s.role));

    const mergedFieldPolicies = [
      ...(this.options.fieldPolicies ?? []),
      ...(options?.fieldPolicies ?? []),
    ].filter((p) => activeRoles.has(p.role));

    const fieldMapping = options?.fieldMapping ?? this.options.fieldMapping;
    const rules: IntermediateRule[] = [];

    for (const roleName of roleNames) {
      const persisted = byRole.get(roleName);
      const statement = persisted
        ? parsePersistedPermissions(persisted)
        : this.options.staticRolePermissions?.[roleName];
      if (!statement) {
        continue;
      }

      const grants = validatePermission(this.catalog, roleName, statement);
      for (const grant of grants) {
        // 匹配与当前动作严格对应（或全局通用）的数据范围配置，杜绝读写跨 Action 范围污染
        const roleResourceScopes = mergedDataScopes.filter(
          (s) =>
            s.role === roleName &&
            s.resource === grant.resource &&
            (!s.action || s.action === grant.action),
        );
        const conditions = resolveDataScopeConditions(
          roleResourceScopes,
          topology,
          fieldMapping,
        );

        const roleSubjectPolicies = mergedFieldPolicies.filter(
          (p) => p.role === roleName && p.subject === grant.subject,
        );

        if (roleSubjectPolicies.length === 0) {
          const rule: IntermediateRule = {
            action: grant.action,
            subject: grant.subject,
          };
          if (conditions) {
            rule.conditions = conditions;
          }
          rules.push(rule);
        } else {
          const allowedFields = computeAllowedFields(
            grant.action,
            roleSubjectPolicies,
          );
          if (allowedFields.length > 0) {
            const rule: IntermediateRule = {
              action: grant.action,
              subject: grant.subject,
              fields: allowedFields,
            };
            if (conditions) {
              rule.conditions = conditions;
            }
            rules.push(rule);
          }
        }
      }
    }

    // SAFETY: createPrismaAbility 接收带有 conditions 和 fields 的规则集合并创建类型化 PrismaAbility
    const rawRules = rules as unknown as Parameters<
      typeof createPrismaAbility
    >[0];
    const ability = createPrismaAbility(rawRules);
    // SAFETY: 断言转换为目录绑定的 AppPrismaAbility，确保编译期 action/subject 契约严格受限
    return ability as unknown as AppPrismaAbility<
      CatalogAction<TDefinitions>,
      CatalogSubject<TDefinitions>
    >;
  }
}
