import { headers } from "next/headers";
import { getCurrentTenantContext, getServerAuthRuntime } from "@chenrun/auth";
import {
  CaslAbilityFactory,
  FieldPolicy,
  parsePersistedPermissions,
  type FieldAccessMode,
} from "@chenrun/authorization";
import { globalTenantCatalog } from "./global-catalog";

export interface SerializedAbility {
  readonly actions: readonly string[];
  readonly fieldPolicies: Readonly<Record<string, FieldAccessMode>>;
}

/**
 * 在 Server Component 中获取当前登录用户针对特定 Subject 的强类型权限描述
 * 严格遵循 Fail-Closed 原则：若未登录或未授权，默认空数组 (全部拒绝)
 */
export async function getTenantSubjectPermissions(
  subject: string,
): Promise<{
  actions: string[];
  fieldPolicies: Record<string, FieldAccessMode>;
  can: (action: string, s?: string, field?: string) => boolean;
}> {
  try {
    const reqHeaders = await headers();
    const runtime = getServerAuthRuntime();
    const tenantCtx = await getCurrentTenantContext(reqHeaders);
    const factory = new CaslAbilityFactory(
      runtime.tenantContextRepository,
      globalTenantCatalog,
    );
    const ability = await factory.createForTenant(tenantCtx);

    const actions = ["read", "create", "update", "delete", "audit", "export"];
    const allowedActions: string[] = [];

    for (const act of actions) {
      if (ability.can(act as never, subject as never)) {
        allowedActions.push(act);
      }
    }

    // 提取字段策略 (从 Control DB 角色中读取对应 subject 的 fieldPolicies)
    const fieldPolicies: Record<string, FieldAccessMode> = {};

    // SAFETY: resolveRolesAndStatements is an internal helper on CaslAbilityFactory that reads persistent role definitions
    const { byRole, roleNames } = await (factory as unknown as {
      resolveRolesAndStatements: (ctx: typeof tenantCtx) => Promise<{
        byRole: Map<string, { role: string; permission: string }>;
        roleNames: string[];
      }>;
    }).resolveRolesAndStatements(tenantCtx);

    // 如果是 owner，全量放行
    if (roleNames.includes("owner")) {
      return {
        actions,
        fieldPolicies,
        can: () => true,
      };
    }

    for (const roleName of roleNames) {
      const persisted = byRole.get(roleName);
      if (persisted) {
        const parsed = parsePersistedPermissions(persisted as never);
        if (parsed?.fieldPolicies) {
          for (const fp of parsed.fieldPolicies) {
            if (fp.subject === subject) {
              fieldPolicies[fp.field] = fp.access;
            }
          }
        }
      }
    }

    return {
      actions: allowedActions,
      fieldPolicies,
      can(action: string, targetSubject?: string, field?: string) {
        if (targetSubject && targetSubject !== subject) {
          return false;
        }
        if (!allowedActions.includes(action)) {
          return false;
        }
        if (field && fieldPolicies[field] === FieldPolicy.HIDDEN) {
          return false;
        }
        return true;
      },
    };
  } catch {
    return {
      actions: [],
      fieldPolicies: {},
      can: () => false,
    };
  }
}
