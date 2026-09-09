import type {
  AuthorizationRepository,
  OrganizationRoleRecord,
} from "@chenrun/db-control";
import {
  FieldPolicy,
  parsePersistedPermissions,
  serializeRolePermissions,
  type RolePermissionPayload,
} from "@chenrun/authorization";
import { ProcurementSubject } from "@chenrun/feature-procurement-center";
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
        defaultPayload: {
          statement: {
            "procurement.order": [
              "read",
              "create",
              "update",
              "audit",
              "export",
            ],
            customer: ["read", "create", "update", "delete"],
            customer_store: ["read", "create", "update", "delete"],
            customer_category_tag: ["read", "create", "update", "delete"],
            customer_quote: ["read", "create", "update", "audit"],
            // 组织架构
            "organization.employee": ["read", "create", "update", "delete"],
            "organization.department": ["read", "create", "update", "delete"],
            "organization.position": ["read", "create", "update", "delete"],
            // 权限管理
            "system.roles": ["read", "update"],
            // 企业设置
            "settings.company": ["read", "update"],
            "settings.general": ["read", "update"],
            "settings.security": ["read", "update"],
            // 审计日志
            "audit.operations": ["read", "export"],
            "audit.logins": ["read", "export"],
            "audit.permissions": ["read", "export"],
          },
          dataScopes: [
            {
              resource: "procurement.order",
              scopeType: "DEPT_TREE",
            },
            {
              resource: "customer",
              action: "read",
              scopeType: "ALL",
            },
            {
              resource: "customer_store",
              action: "read",
              scopeType: "ALL",
            },
            {
              resource: "customer_quote",
              action: "read",
              scopeType: "ALL",
            },
          ],
          fieldPolicies: [],
        },
      },
      {
        role: "member",
        name: "标准成员 (Member)",
        description: "企业默认员工角色，默认拥有部门级受限查看权限",
        defaultPayload: {
          statement: {
            "procurement.order": ["read"],
            customer: ["read"],
            customer_store: ["read"],
            customer_quote: ["read"],
          },
          dataScopes: [
            {
              resource: "procurement.order",
              action: "read",
              scopeType: "DEPT",
            },
            {
              resource: "customer",
              action: "read",
              scopeType: "DEPT",
            },
            {
              resource: "customer_store",
              action: "read",
              scopeType: "DEPT",
            },
            {
              resource: "customer_quote",
              action: "read",
              scopeType: "SELF",
            },
          ],
          fieldPolicies: [
            {
              subject: ProcurementSubject,
              field: "costPrice",
              access: FieldPolicy.READONLY,
            },
          ],
        },
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
