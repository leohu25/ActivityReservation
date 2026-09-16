import type {
  AuthorizationRepository,
  OrganizationRoleRecord,
} from "@base/db-control";
import {
  BUILT_IN_ROLES,
  type BuiltInRole,
  isBuiltInRole,
  DataScope,
  FieldPolicy,
  StandardAction,
  parsePersistedPermissions,
  type RolePermissionPayload,
  type TenantFeatureManifest,
} from "@base/authorization";
import type {
  CreateRoleInput,
  SaveRolePermissionsInput,
  TenantRoleItem,
  UpdateRoleInput,
  ListRolesQueryInput,
  PaginatedRolesResult,
} from "./types";

export { BUILT_IN_ROLES, type BuiltInRole, isBuiltInRole };

export class TenantRoleServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantRoleServiceError";
  }
}

/**
 * 依据切片自描述清单契约动态自驱推导核心内置角色的四层权限模板
 * 彻底消除硬编码外部业务切片符号与资源，由调用方或应用层显式注入切片清单 (IoC)
 */
export function deriveBuiltInRoleDefaults(
  manifests: readonly TenantFeatureManifest[] = [],
): Record<"admin" | "member", RolePermissionPayload> {
  // 1. Admin: 赋予所有注册切片的全部合法 actions，数据范围赋予最大支持级别 (ALL / DEPT_TREE)
  const adminStatement: Record<string, string[]> = {};
  const adminDataScopes: Array<
    NonNullable<RolePermissionPayload["dataScopes"]>[number]
  > = [];

  // 2. Member: 仅赋予已注册切片的 read 动作，默认部门级受限查看，敏感字段默认只读保护
  const memberStatement: Record<string, string[]> = {};
  const memberDataScopes: Array<
    NonNullable<RolePermissionPayload["dataScopes"]>[number]
  > = [];
  const memberFieldPolicies: Array<
    NonNullable<RolePermissionPayload["fieldPolicies"]>[number]
  > = [];

  for (const manifest of manifests) {
    if (!manifest.permissionModules) continue;

    for (const mod of manifest.permissionModules) {
      for (const page of mod.pages) {
        // Admin 配置
        adminStatement[page.resource] = page.actions.map((a) => a.action);

        for (const act of page.actions) {
          if (act.supportedScopes && act.supportedScopes.length > 0) {
            const fallbackScope = act.supportedScopes[0];
            let maxScope: (typeof act.supportedScopes)[number] =
              act.supportedScopes.at(-1) ?? fallbackScope;
            if (act.supportedScopes.includes(DataScope.ALL)) {
              maxScope = DataScope.ALL;
            } else if (act.supportedScopes.includes(DataScope.DEPT_TREE)) {
              maxScope = DataScope.DEPT_TREE;
            }

            adminDataScopes.push({
              resource: page.resource,
              action: act.action,
              scopeType: maxScope,
            });
          }
        }

        // Member 配置
        const readAct = page.actions.find(
          (a) => a.action === StandardAction.READ,
        );
        if (readAct) {
          memberStatement[page.resource] = [StandardAction.READ];

          if (readAct.supportedScopes && readAct.supportedScopes.length > 0) {
            let memberScope: (typeof readAct.supportedScopes)[number] =
              readAct.supportedScopes[0];
            if (readAct.supportedScopes.includes(DataScope.DEPT)) {
              memberScope = DataScope.DEPT;
            } else if (readAct.supportedScopes.includes(DataScope.SELF)) {
              memberScope = DataScope.SELF;
            }

            memberDataScopes.push({
              resource: page.resource,
              action: StandardAction.READ,
              scopeType: memberScope,
            });
          }
        }

        // 敏感字段只读保护
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
  constructor(
    private readonly repository: AuthorizationRepository,
    private readonly manifests: readonly TenantFeatureManifest[] = [],
  ) {}

  /** 查询指定租户下的全部角色清单（包含内置系统角色与自定义扩展角色） */
  async listTenantRoles(organizationId: string): Promise<TenantRoleItem[]> {
    const records = await this.repository.listOrganizationRoles(organizationId);
    const recordMap = new Map<string, OrganizationRoleRecord>();
    for (const record of records) {
      recordMap.set(record.role, record);
    }

    const items: TenantRoleItem[] = [];

    // 1. 确保可配置的核心内置角色在前排列（明确排除 owner，因为超级管理员具备所有权限且租户管理员不得管理超管）
    const derivedDefaults = deriveBuiltInRoleDefaults(this.manifests);
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
          permissions: {
            statement: {},
            dataScopes: [],
            fieldPolicies: [],
          },
          updatedAt: null,
        });
      }
    }

    // 2. 追加自定义动态角色
    for (const record of records) {
      if (!handledRoles.has(record.role)) {
        handledRoles.add(record.role);
        const parsed = parsePersistedPermissions(record);
        let metaName: string | undefined;
        let metaDesc: string | undefined;
        try {
          const rawObj = JSON.parse(record.permission);
          if (rawObj && typeof rawObj === "object") {
            if (typeof rawObj._metaName === "string")
              metaName = rawObj._metaName;
            if (typeof rawObj._metaDescription === "string")
              metaDesc = rawObj._metaDescription;
          }
        } catch {
          // 忽略非法 JSON
        }

        items.push({
          id: record.id,
          role: record.role,
          name: metaName || record.role,
          description: metaDesc || "自定义业务角色",
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

    // 保留既有的 _metaName 与 _metaDescription
    let metaName: string | undefined;
    let metaDesc: string | undefined;
    const existingRecords = await this.repository.findOrganizationRoles(
      input.organizationId,
      [input.role],
    );
    if (existingRecords[0]) {
      try {
        const raw = JSON.parse(existingRecords[0].permission);
        if (raw && typeof raw === "object") {
          if (typeof raw._metaName === "string") metaName = raw._metaName;
          if (typeof raw._metaDescription === "string")
            metaDesc = raw._metaDescription;
        }
      } catch {
        // ignore
      }
    }

    const permissionJson = JSON.stringify({
      ...input.payload,
      ...(metaName ? { _metaName: metaName } : {}),
      ...(metaDesc ? { _metaDescription: metaDesc } : {}),
    });

    const updated = await this.repository.upsertOrganizationRole({
      organizationId: input.organizationId,
      role: input.role,
      permission: permissionJson,
    });

    const parsed = parsePersistedPermissions(updated);
    return {
      id: updated.id,
      role: updated.role,
      name: metaName || updated.role,
      description: metaDesc || undefined,
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

    const permissionJson = JSON.stringify({
      ...initialPayload,
      _metaName: input.roleName?.trim() || roleCode,
      _metaDescription: input.description?.trim() || undefined,
    });

    const created = await this.repository.upsertOrganizationRole({
      organizationId: input.organizationId,
      role: roleCode,
      permission: permissionJson,
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

  /** 编辑更新自定义角色的显示名称与描述 */
  async updateRole(input: UpdateRoleInput): Promise<TenantRoleItem> {
    const roleCode = input.roleCode.trim();
    if (!roleCode) {
      throw new TenantRoleServiceError("角色编码不能为空");
    }
    if (isBuiltInRole(roleCode)) {
      throw new TenantRoleServiceError(
        `系统核心内置角色不支持在此修改名称: ${roleCode}`,
      );
    }

    const records = await this.repository.findOrganizationRoles(
      input.organizationId,
      [roleCode],
    );
    const existing = records[0];
    if (!existing) {
      throw new TenantRoleServiceError(`未找到待更新的角色: ${roleCode}`);
    }

    const parsed = parsePersistedPermissions(existing);
    const payload: RolePermissionPayload = {
      statement: parsed.statement,
      dataScopes: parsed.dataScopes,
      fieldPolicies: parsed.fieldPolicies,
    };

    const permissionJson = JSON.stringify({
      ...payload,
      _metaName: input.roleName?.trim() || roleCode,
      _metaDescription: input.description?.trim() || undefined,
    });

    const updated = await this.repository.upsertOrganizationRole({
      organizationId: input.organizationId,
      role: roleCode,
      permission: permissionJson,
    });

    return {
      id: updated.id,
      role: updated.role,
      name: input.roleName?.trim() || updated.role,
      description: input.description?.trim() || undefined,
      isSystem: false,
      permissions: payload,
      updatedAt: updated.updatedAt,
    };
  }

  /** 服务端分页与关键字检索租户角色列表 */
  async searchTenantRoles(
    organizationId: string,
    params?: ListRolesQueryInput,
  ): Promise<PaginatedRolesResult> {
    const allRoles = await this.listTenantRoles(organizationId);

    const page = Math.max(1, params?.page ?? 1);
    const pageSize = Math.max(1, params?.pageSize ?? 10);
    const q = params?.keyword?.trim().toLowerCase();

    const filtered = q
      ? allRoles.filter(
          (r) =>
            r.role.toLowerCase().includes(q) ||
            r.name.toLowerCase().includes(q) ||
            (r.description && r.description.toLowerCase().includes(q)),
        )
      : allRoles;

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      items,
      total,
      page,
      pageSize,
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
