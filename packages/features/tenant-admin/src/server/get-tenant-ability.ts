import { headers } from "next/headers";
import { getCurrentTenantContext, getServerAuthRuntime } from "@chenrun/auth";
import {
  CaslAbilityFactory,
  filterNavSections,
  parsePersistedPermissions,
  type FeatureNavSection,
  type FieldAccessMode,
} from "@chenrun/authorization";
import { toPlainData } from "@chenrun/shared";
import {
  globalTenantCatalog,
  globalTenantNavSections,
} from "../registry.generated";

export interface TenantSubjectPermissions {
  readonly actions: readonly string[];
  readonly fieldPolicies: Readonly<Record<string, FieldAccessMode>>;
}

/**
 * 在 Server Component 中获取当前登录用户针对特定 Subject 的强类型权限纯数据描述
 * 严格遵循 RSC 跨端序列化规范：仅返回纯 JSON 对象，杜绝传递不可序列化的函数与类实例！
 * 严格遵循 Fail-Closed 原则：若未登录或未授权，默认空数组 (全部拒绝)
 */
export async function getTenantSubjectPermissions(
  subject: string,
): Promise<TenantSubjectPermissions> {
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
    const { byRole, roleNames } = await (
      factory as unknown as {
        resolveRolesAndStatements: (ctx: typeof tenantCtx) => Promise<{
          byRole: Map<string, { role: string; permission: string }>;
          roleNames: string[];
        }>;
      }
    ).resolveRolesAndStatements(tenantCtx);

    // 如果是 owner，全量放行
    if (roleNames.includes("owner")) {
      return toPlainData({
        actions,
        fieldPolicies,
      });
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

    return toPlainData({
      actions: allowedActions,
      fieldPolicies,
    });
  } catch {
    return toPlainData({
      actions: [],
      fieldPolicies: {},
    });
  }
}

/**
 * 服务端获取当前登录租户成员已授权的导航菜单区块 (Server-Side Navigation Engine)
 * 使用 CASL Ability 过滤无权访问的项目与空分组，直接返回已裁切完毕的纯数据菜单
 */
export async function getAuthorizedTenantNavSections(): Promise<
  FeatureNavSection[]
> {
  try {
    const reqHeaders = await headers();
    const runtime = getServerAuthRuntime();
    const tenantCtx = await getCurrentTenantContext(reqHeaders);
    const factory = new CaslAbilityFactory(
      runtime.tenantContextRepository,
      globalTenantCatalog,
    );
    const ability = await factory.createForTenant(tenantCtx);

    return filterNavSections(globalTenantNavSections, (action, subject) =>
      ability.can(action as never, subject as never),
    );
  } catch {
    return [];
  }
}
