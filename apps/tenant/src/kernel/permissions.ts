import { cache } from "react";
import { headers } from "next/headers";
import { getCurrentTenantContext, getServerAuthRuntime } from "@base/auth";
import { CaslAbilityFactory, type FieldAccessMode } from "@base/authorization";
import { toPlainData } from "@base/shared";
import { globalTenantCatalog } from "./registry.generated";

export interface TenantSubjectPermissions {
  readonly actions: readonly string[];
  readonly fieldPolicies: Readonly<Record<string, FieldAccessMode>>;
}

/**
 * 缓存单次请求周期内的 TenantContext 与 CASL Ability
 * 利用 React 19 cache(...) 机制：在同一个 HTTP 请求/RSC 渲染树内，
 * 无论有多少个 Layout / Component 消费权限，只查一次数据库、只计算一次全量 Ability 实例！
 */
const getCachedTenantAbilityContext = cache(async () => {
  const reqHeaders = await headers();
  const runtime = getServerAuthRuntime();
  const tenantCtx = await getCurrentTenantContext(reqHeaders);
  const factory = new CaslAbilityFactory(
    runtime.tenantContextRepository,
    globalTenantCatalog,
  );
  const [ability, roleNames] = await Promise.all([
    factory.createForTenant(tenantCtx),
    factory.resolveMemberRoleNames(tenantCtx),
  ]);

  return {
    factory,
    tenantCtx,
    ability,
    roleNames,
  };
});

/**
 * 在 Server Component 中获取当前登录用户针对特定 Subject 的强类型权限纯数据描述
 * 严格遵循 RSC 跨端序列化规范：仅返回纯 JSON 对象，杜绝传递不可序列化的函数与类实例！
 * 严格遵循 Fail-Closed 原则：若未登录或未授权，默认空数组 (全部拒绝)
 *
 * 动作清单唯一来源：该 Subject 在页面契约中声明的标准动作 + 自定义扩展动作
 * （经 globalTenantCatalog 派生，禁止再维护第二份硬编码白名单）。
 */
export async function getTenantSubjectPermissions(
  subject: string,
): Promise<TenantSubjectPermissions> {
  try {
    const { factory, tenantCtx, ability, roleNames } =
      await getCachedTenantAbilityContext();

    const declaredActions = globalTenantCatalog.getDeclaredActions(subject);
    const allowedActions: string[] = [];

    for (const act of declaredActions) {
      if (ability.can(act as never, subject as never)) {
        allowedActions.push(act);
      }
    }

    // owner 全量放行（仅限契约声明动作）；字段策略经工厂公开 API 聚合
    if (roleNames.includes("owner")) {
      return toPlainData({
        actions: declaredActions,
        fieldPolicies: {},
      });
    }

    const fieldPolicies = await factory.resolveFieldPoliciesForSubject(
      tenantCtx,
      subject,
    );

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
 * 批量获取多个 Subject 的 CASL 权限纯数据描述 (供复合看板/工作台批量注入 Ability 边界)
 */
export async function getTenantMultiSubjectPermissions(
  subjects: readonly string[],
): Promise<Record<string, TenantSubjectPermissions>> {
  const entries = await Promise.all(
    subjects.map(async (subj) => {
      const perms = await getTenantSubjectPermissions(subj);
      return [subj, perms] as const;
    }),
  );
  return Object.fromEntries(entries);
}
