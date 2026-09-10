import type {
  AuthorizationRepository,
  OrganizationRoleRecord,
} from "@chenrun/db-control";
import {
  DataScope,
  FieldPolicy,
  parsePersistedPermissions,
  serializeRolePermissions,
  type RolePermissionPayload,
  type TenantFeatureManifest,
} from "@chenrun/authorization";
import { ALL_TENANT_MANIFESTS } from "../registry.generated";
import type {
  CreateRoleInput,
  SaveRolePermissionsInput,
  TenantRoleItem,
} from "../types";

export const BUILT_IN_ROLES = ["owner", "admin", "member"] as const;
export type BuiltInRole = (typeof BUILT_IN_ROLES)[number];

export function isBuiltInRole(role: string): boolean {
  return BUILT_IN_ROLES.includes(role as BuiltInRole);
}

export class TenantRoleServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantRoleServiceError";
  }
}

/**
 * 依据全局切片自描述清单契约 (ALL_TENANT_MANIFESTS) 动态自驱推导核心内置角色的四层权限模板
 * 彻底消除硬编码外部业务切片符号与资源（采购、客户等），形成真正的单一事实源 (SSoT)
 */
export function deriveBuiltInRoleDefaults(
  manifests: readonly TenantFeatureManifest[] = ALL_TENANT_MANIFESTS,
): Record<"admin" | "member", RolePermissionPayload> {
  // 1. Admin: 赋予所有注册切片的全部合法 actions，数据范围赋予最大支持级别 (ALL / DEPT_TREE)
  const adminStatement: Record<string, string[]> = {};
  const adminDataScopes: Array<
    NonNullable<RolePermissionPayload["dataScopes"]>[number]
  > = [];

  for (const manifest of manifests) {
    for (const def of manifest.permissions) {
      adminStatement[def.resource] = [...def.actions];

      let hasScopeConfigured = false;
      if (def.actionMetadata) {
        for (const [action, meta] of Object.entries(def.actionMetadata)) {
          if (meta?.scopes && meta.scopes.length > 0) {
            hasScopeConfigured = true;
            const maxScope = meta.scopes.includes(DataScope.ALL)
              ? DataScope.ALL
              : meta.scopes.includes(DataScope.DEPT_TREE)
                ? DataScope.DEPT_TREE
                : meta.scopes[meta.scopes.length - 1];

            adminDataScopes.push({
              resource: def.resource,
              action,
              scopeType: maxScope,
            });
          }
        }
      }

      if (!hasScopeConfigured && manifest.permissionModules) {
        for (const mod of manifest.permissionModules) {
          for (const page of mod.pages) {
            if (page.resource === def.resource) {
              for (const act of page.actions) {
                if (act.supportedScopes && act.supportedScopes.length > 0) {
                  hasScopeConfigured = true;
                  const maxScope = act.supportedScopes.includes(DataScope.ALL)
                    ? DataScope.ALL
                    : act.supportedScopes.includes(DataScope.DEPT_TREE)
                      ? DataScope.DEPT_TREE
                      : act.supportedScopes[act.supportedScopes.length - 1];
                  adminDataScopes.push({
                    resource: def.resource,
                    action: act.action,
                    scopeType: maxScope,
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  // 2. Member: 仅赋予已注册切片的 read 动作，默认部门级受限查看，敏感字段默认只读保护
  const memberStatement: Record<string, string[]> = {};
  const memberDataScopes: Array<
    NonNullable<RolePermissionPayload["dataScopes"]>[number]
  > = [];
  const memberFieldPolicies: Array<
    NonNullable<RolePermissionPayload["fieldPolicies"]>[number]
  > = [];

  for (const manifest of manifests) {
    for (const def of manifest.permissions) {
      if (def.actions.includes("read" as never)) {
        memberStatement[def.resource] = ["read"];

        let readScopes: readonly string[] | undefined;
        if (def.actionMetadata?.read?.scopes) {
          readScopes = def.actionMetadata.read.scopes;
        } else if (manifest.permissionModules) {
          for (const mod of manifest.permissionModules) {
            for (const page of mod.pages) {
              if (page.resource === def.resource) {
                const readAct = page.actions.find((a) => a.action === "read");
                if (readAct?.supportedScopes) {
                  readScopes = readAct.supportedScopes;
                }
              }
            }
          }
        }

        if (readScopes && readScopes.length > 0) {
          const memberScope = readScopes.includes(DataScope.DEPT)
            ? DataScope.DEPT
            : readScopes.includes(DataScope.SELF)
              ? DataScope.SELF
              : (readScopes[0] as typeof DataScope.DEPT);

          memberDataScopes.push({
            resource: def.resource,
            action: "read",
            scopeType: memberScope,
          });
        }
      }
    }

    if (manifest.permissionModules) {
      for (const mod of manifest.permissionModules) {
        for (const page of mod.pages) {
          if (page.configurableFields) {
            for (const f of page.configurableFields) {
              if (f.sensitive) {
                memberFieldPolicies.push({
                  subject: page.subject,
                  field: f.field,
                  access: FieldPolicy.READONLY,
                });
              }
            }
          }
        }
      }
    }
  }

  return {
    admin: {
      statement: adminStatement,
      dataScopes: adminDataScopes,
      fieldPolicies: [],
    },
    member: {
      statement: memberStatement,
      dataScopes: memberDataScopes,
      fieldPolicies: memberFieldPolicies,
    },
  };
}

/** 租户角色与权限管理领域服务 */
export class TenantRoleService {
  constructor(private readonly repository: AuthorizationRepository) {}

  /** 查询指定租户下的全部角色清单（包含内置系统角色与自定义扩展角色） */
  async listTenantRoles(organizationId: string): Promise<TenantRoleItem[]> {
    const records = await this.repository.listOrganizationRoles(organizationId);
    const recordMap = new Map<string, OrganizationRoleRecord>();
    for (const record of records) {
      recordMap.set(record.role, record);
    }

    const items: TenantRoleItem[] = [];

    // 1. 确保可配置的核心内置角色在前排列（明确排除 owner，因为超级管理员具备所有权限且租户管理员不得管理超管）
    const derivedDefaults = deriveBuiltInRoleDefaults();
    const builtInDefaults: Array<{
      role: BuiltInRole;
      name: string;
      description: string;
      defaultPayload: RolePermissionPayload;
    }> = [
      {
        role: "admin",
        name: "租户管理员 (Admin)",
        description: "协助企业最高管理者进行日常业务审批与系统配置",
        defaultPayload: derivedDefaults.admin,
      },
      {
        role: "member",
        name: "标准成员 (Member)",
        description: "企业默认员工角色，默认拥有部门级受限查看权限",
        defaultPayload: derivedDefaults.member,
      },
    ];

    const handledRoles = new Set<string>(["owner"]); // owner 内部吸收，对外彻底屏蔽

    for (const builtIn of builtInDefaults) {
      handledRoles.add(builtIn.role);
      const persisted = recordMap.get(builtIn.role);
      if (persisted) {
        const parsed = parsePersistedPermissions(persisted);
        items.push({
          id: persisted.id,
          role: builtIn.role,
          name: builtIn.name,
          description: builtIn.description,
          isSystem: true,
          permissions: {
            statement: parsed.statement,
            dataScopes: parsed.dataScopes,
            fieldPolicies: parsed.fieldPolicies,
          },
          updatedAt: persisted.updatedAt,
        });
      } else {
        items.push({
          id: `default-${builtIn.role}`,
          role: builtIn.role,
          name: builtIn.name,
          description: builtIn.description,
          isSystem: true,
          permissions: builtIn.defaultPayload,
          updatedAt: null,
        });
      }
    }

    // 2. 追加自定义动态角色
    for (const record of records) {
      if (!handledRoles.has(record.role)) {
        handledRoles.add(record.role);
        const parsed = parsePersistedPermissions(record);
        items.push({
          id: record.id,
          role: record.role,
          name: record.role,
          description: "自定义业务角色",
          isSystem: false,
          permissions: {
            statement: parsed.statement,
            dataScopes: parsed.dataScopes,
            fieldPolicies: parsed.fieldPolicies,
          },
          updatedAt: record.updatedAt,
        });
      }
    }

    return items;
  }

  /** 保存或更新角色的四层权限配置 */
  async saveRolePermissions(
    input: SaveRolePermissionsInput,
  ): Promise<TenantRoleItem> {
    if (!input.organizationId.trim()) {
      throw new TenantRoleServiceError("组织 ID 不能为空");
    }
    if (!input.role.trim()) {
      throw new TenantRoleServiceError("角色编码不能为空");
    }
    if (input.role.trim() === "owner") {
      throw new TenantRoleServiceError(
        "超级管理员 (Owner) 拥有全局固有权限，不可在此修改",
      );
    }

    const permissionJson = serializeRolePermissions(input.payload);
    const updated = await this.repository.upsertOrganizationRole({
      organizationId: input.organizationId,
      role: input.role,
      permission: permissionJson,
    });

    const parsed = parsePersistedPermissions(updated);
    return {
      id: updated.id,
      role: updated.role,
      name: updated.role,
      isSystem: isBuiltInRole(updated.role),
      permissions: {
        statement: parsed.statement,
        dataScopes: parsed.dataScopes,
        fieldPolicies: parsed.fieldPolicies,
      },
      updatedAt: updated.updatedAt,
    };
  }

  /** 创建新的自定义业务角色 */
  async createRole(input: CreateRoleInput): Promise<TenantRoleItem> {
    const roleCode = input.roleCode.trim();
    if (!roleCode) {
      throw new TenantRoleServiceError("角色编码不能为空");
    }
    // 角色编码仅允许小写字母、数字与下划线
    if (!/^[a-z][a-z0-9_]{1,30}$/.test(roleCode)) {
      throw new TenantRoleServiceError(
        "角色编码必须以小写字母开头，由 2-31 位小写字母、数字或下划线组成",
      );
    }
    if (isBuiltInRole(roleCode)) {
      throw new TenantRoleServiceError(`不能重复创建系统内置角色: ${roleCode}`);
    }

    // 默认空权限模板
    const initialPayload: RolePermissionPayload = {
      statement: {},
      dataScopes: [],
      fieldPolicies: [],
    };

    const created = await this.repository.upsertOrganizationRole({
      organizationId: input.organizationId,
      role: roleCode,
      permission: serializeRolePermissions(initialPayload),
    });

    return {
      id: created.id,
      role: created.role,
      name: input.roleName || created.role,
      description: input.description,
      isSystem: false,
      permissions: initialPayload,
      updatedAt: created.updatedAt,
    };
  }

  /** 删除指定的自定义业务角色 */
  async deleteRole(organizationId: string, role: string): Promise<void> {
    if (isBuiltInRole(role)) {
      throw new TenantRoleServiceError(`严禁删除系统核心内置角色: ${role}`);
    }
    await this.repository.deleteOrganizationRole(organizationId, role);
  }
}
