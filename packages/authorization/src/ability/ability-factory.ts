import { createMongoAbility, type MongoAbility } from "@casl/ability";
import { createPrismaAbility, type PrismaAbility } from "@casl/prisma";
import type { TenantContext } from "@base/auth";
import type {
  AuthorizationRepository,
  OrganizationRoleRecord,
} from "@base/db-control";
import type {
  CatalogAction,
  CatalogSubject,
  PermissionCatalog,
  PermissionDefinition,
} from "../core/catalog";
import {
  type RoleDataScopeConfig,
  type UserDepartmentTopology,
  type DataScopeFieldMapping,
  type PrismaQueryCondition,
  resolveDataScopeConditions,
} from "../scopes/data-scope";
import {
  FieldPolicy,
  type FieldAccessMode,
  type RoleFieldPolicyConfig,
} from "../fields/field-policy";

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

/** 完整的四层角色权限配置 Payload (功能权限 + 数据范围 + 字段策略) */
export interface RolePermissionPayload {
  /** 功能权限语句 (resource -> actions[]) */
  readonly statement: RolePermissionStatement;
  /** 数据范围规则 (可选) */
  readonly dataScopes?: readonly Omit<RoleDataScopeConfig, "role">[];
  /** 字段策略规则 (可选) */
  readonly fieldPolicies?: readonly Omit<RoleFieldPolicyConfig, "role">[];
}

export interface ParsedRolePermissions {
  readonly statement: RolePermissionStatement;
  readonly dataScopes: readonly RoleDataScopeConfig[];
  readonly fieldPolicies: readonly RoleFieldPolicyConfig[];
}

/** 序列化四层角色权限 Payload 为 JSON 字符串以持久化至 Control DB */
export function serializeRolePermissions(
  payload: RolePermissionPayload,
): string {
  return JSON.stringify(payload);
}

export interface AbilityFactoryOptions {
  staticRolePermissions?: Readonly<Record<string, RolePermissionStatement>>;
  /**
   * 是否允许局部切片跳过未知资源（默认 true，提高切片解耦容错度）
   */
  ignoreUnknownResources?: boolean;
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

function parseStatementObject(
  roleName: string,
  rawStatement: unknown,
): RolePermissionStatement {
  if (
    !rawStatement ||
    typeof rawStatement !== "object" ||
    Array.isArray(rawStatement)
  ) {
    throw new AbilityFactoryError(
      `Role ${roleName} permissions must be an object`,
    );
  }

  const result: Record<string, readonly string[]> = {};
  for (const [resource, actions] of Object.entries(rawStatement)) {
    if (
      !Array.isArray(actions) ||
      actions.some((action) => typeof action !== "string")
    ) {
      throw new AbilityFactoryError(
        `Role ${roleName} contains invalid actions for ${resource}`,
      );
    }
    result[resource] = actions;
  }
  return result;
}

export function parsePersistedPermissions(
  record: OrganizationRoleRecord,
): ParsedRolePermissions {
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

  const candidate = value as Record<string, unknown>;

  // 判断是否为四层扩展结构 (携带 statement 属性)
  if ("statement" in candidate) {
    const statement = parseStatementObject(record.role, candidate.statement);
    const dataScopes: RoleDataScopeConfig[] = [];
    if (Array.isArray(candidate.dataScopes)) {
      for (const item of candidate.dataScopes) {
        if (
          item &&
          typeof item === "object" &&
          typeof item.resource === "string" &&
          typeof item.scopeType === "string"
        ) {
          dataScopes.push({
            role: record.role,
            resource: item.resource,
            action: typeof item.action === "string" ? item.action : undefined,
            scopeType: item.scopeType,
            customDepartmentIds: Array.isArray(item.customDepartmentIds)
              ? item.customDepartmentIds
              : undefined,
          });
        }
      }
    }

    const fieldPolicies: RoleFieldPolicyConfig[] = [];
    if (Array.isArray(candidate.fieldPolicies)) {
      for (const item of candidate.fieldPolicies) {
        if (
          item &&
          typeof item === "object" &&
          typeof item.subject === "string" &&
          typeof item.field === "string" &&
          typeof item.access === "string"
        ) {
          fieldPolicies.push({
            role: record.role,
            subject: item.subject,
            field: item.field,
            access: item.access,
          });
        }
      }
    }

    return { statement, dataScopes, fieldPolicies };
  }

  // 向后兼容处理：直接作为纯功能权限语句
  const statement = parseStatementObject(record.role, candidate);
  return { statement, dataScopes: [], fieldPolicies: [] };
}

function validatePermission<
  const TDefinitions extends readonly PermissionDefinition[],
>(
  catalog: PermissionCatalog<TDefinitions>,
  role: string,
  statement: RolePermissionStatement,
  ignoreUnknownResources = true,
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
    // 工业级切片解耦设计：
    // 若当前业务切片 Catalog 专注于自身领域（如采购订单只注册了 procurement.order），
    // 则遇到其他领域（如 customer、organization 等）的权限语句时安全跳过，只提取与当前 Catalog 契约匹配的规则，
    // 避免因单体 Catalog 无法识别全局所有切片而导致页面级联瘫痪。
    if (!definition) {
      if (ignoreUnknownResources) {
        continue;
      }
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
 * - catalogFields: 当前资源或动作在 PermissionCatalog 中声明的全部可用业务字段列表
 * - policies: 当前角色针对该实体的字段策略配置
 *
 * 核心设计规则：
 * 1. 若当前角色显式配置了某字段为 HIDDEN，则任何操作均剥离拒绝；
 * 2. 写操作 (create / update) 严格只放行 access 为 EDITABLE 的字段（READONLY 与 HIDDEN 均拦截）；
 * 3. 读操作 (read) 以及其他通用操作，放行非 HIDDEN 的字段；
 * 4. 对于未在 fieldPolicies 中显式配置的常规业务字段，默认跟随动作授权放行，确保字段策略是增量约束，而非全部抹杀。
 */
function computeAllowedFields(
  action: string,
  catalogFields: readonly string[],
  policies: readonly RoleFieldPolicyConfig[],
): string[] {
  const policyMap = new Map(policies.map((p) => [p.field, p.access]));

  // 如果定义了受控字段清单，则以此为基准进行过滤
  const candidateFields =
    catalogFields.length > 0 ? catalogFields : policies.map((p) => p.field);

  return candidateFields.filter((field) => {
    const access = policyMap.get(field);
    // 1. 显式隐藏：彻底拒绝
    if (access === FieldPolicy.HIDDEN) {
      return false;
    }
    // 2. 写操作：显式只读则不可写
    if (
      (action === "create" || action === "update") &&
      access === FieldPolicy.READONLY
    ) {
      return false;
    }
    return true;
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

  /** 超级管理员 (owner) 全量规则：由 Catalog 定义唯一派生，禁止在业务侧另写一份 */
  private buildOwnerActionRules(): Array<{ action: string; subject: string }> {
    const ownerRules: Array<{ action: string; subject: string }> = [];
    for (const def of this.catalog.definitions) {
      for (const act of def.actions) {
        ownerRules.push({ action: act, subject: def.subject });
      }
    }
    return ownerRules;
  }

  /**
   * 公开：解析当前成员角色名列表（含内置 owner/admin/member）。
   * 供应用层做超管判定或审计，避免反射私有方法。
   */
  async resolveMemberRoleNames(context: TenantContext): Promise<string[]> {
    const { roleNames } = await this.resolveRolesAndStatements(context);
    return roleNames;
  }

  /**
   * 公开：聚合指定 Subject 上的字段策略（多角色合并，后者覆盖前者的同名字段）。
   * owner 无字段限制，返回空对象（全量可读可写，由 Ability 侧放行）。
   */
  async resolveFieldPoliciesForSubject(
    context: TenantContext,
    subject: string,
  ): Promise<Readonly<Record<string, FieldAccessMode>>> {
    const { roleNames, byRole } = await this.resolveRolesAndStatements(context);
    if (roleNames.includes("owner")) {
      return {};
    }

    const fieldPolicies: Record<string, FieldAccessMode> = {};
    for (const roleName of roleNames) {
      const persisted = byRole.get(roleName);
      if (!persisted) continue;
      const parsed = parsePersistedPermissions(persisted);
      if (!parsed?.fieldPolicies) continue;
      for (const fp of parsed.fieldPolicies) {
        if (fp.subject === subject) {
          fieldPolicies[fp.field] = fp.access;
        }
      }
    }
    return fieldPolicies;
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

    // 超级管理员 (owner) 默认具有全部固有最高操作权限 (Wildcard/Bypass)
    if (roleNames.includes("owner")) {
      return createMongoAbility<[string, string]>(
        this.buildOwnerActionRules(),
      ) as CatalogAbility;
    }

    const rules: Array<{ action: string; subject: string }> = [];
    const seen = new Set<string>();
    for (const roleName of roleNames) {
      const persisted = byRole.get(roleName);
      const parsed = persisted
        ? parsePersistedPermissions(persisted)
        : undefined;
      const statement = parsed
        ? parsed.statement
        : this.options.staticRolePermissions?.[roleName];
      if (!statement) {
        continue;
      }
      for (const grant of validatePermission(
        this.catalog,
        roleName,
        statement,
        this.options.ignoreUnknownResources ?? true,
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

    // 超级管理员 (owner) 默认具有全部固有最高操作权限与全量数据范围 (Wildcard/Bypass)
    if (roleNames.includes("owner")) {
      // SAFETY: ownerRules contains valid action/subject pairs conforming to createPrismaAbility parameter schema
      const rawOwnerRules =
        this.buildOwnerActionRules() as unknown as Parameters<
          typeof createPrismaAbility
        >[0];
      // SAFETY: Cast to catalog-bound AppPrismaAbility ensuring compile-time action/subject contract
      return createPrismaAbility(rawOwnerRules) as unknown as AppPrismaAbility<
        CatalogAction<TDefinitions>,
        CatalogSubject<TDefinitions>
      >;
    }

    const persistedDataScopes: RoleDataScopeConfig[] = [];
    const persistedFieldPolicies: RoleFieldPolicyConfig[] = [];
    const parsedStatements = new Map<string, RolePermissionStatement>();

    for (const roleName of roleNames) {
      const persisted = byRole.get(roleName);
      if (persisted) {
        const parsed = parsePersistedPermissions(persisted);
        parsedStatements.set(roleName, parsed.statement);
        persistedDataScopes.push(...parsed.dataScopes);
        persistedFieldPolicies.push(...parsed.fieldPolicies);
      } else if (this.options.staticRolePermissions?.[roleName]) {
        parsedStatements.set(
          roleName,
          this.options.staticRolePermissions[roleName],
        );
      }
    }

    const mergedDataScopes = [
      ...persistedDataScopes,
      ...(this.options.dataScopes ?? []),
      ...(options?.dataScopes ?? []),
    ].filter((s) => activeRoles.has(s.role));

    const mergedFieldPolicies = [
      ...persistedFieldPolicies,
      ...(this.options.fieldPolicies ?? []),
      ...(options?.fieldPolicies ?? []),
    ].filter((p) => activeRoles.has(p.role));

    const fieldMapping = options?.fieldMapping ?? this.options.fieldMapping;
    const rules: IntermediateRule[] = [];

    for (const roleName of roleNames) {
      const statement = parsedStatements.get(roleName);
      if (!statement) {
        continue;
      }

      const grants = validatePermission(
        this.catalog,
        roleName,
        statement,
        this.options.ignoreUnknownResources ?? true,
      );
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
          // 获取当前动作在 Catalog 中定义的可控字段清单
          const catalogFields = this.catalog.getActionFields(
            grant.resource,
            grant.action,
          );
          const allowedFields = computeAllowedFields(
            grant.action,
            catalogFields,
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
