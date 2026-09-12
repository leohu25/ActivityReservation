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
    const reqHeaders = await headers();
    const runtime = getServerAuthRuntime();
    const tenantCtx = await getCurrentTenantContext(reqHeaders);
    const factory = new CaslAbilityFactory(
      runtime.tenantContextRepository,
      globalTenantCatalog,
    );
    const ability = await factory.createForTenant(tenantCtx);

    const declaredActions = globalTenantCatalog.getDeclaredActions(subject);
    const allowedActions: string[] = [];

    for (const act of declaredActions) {
      if (ability.can(act as never, subject as never)) {
        allowedActions.push(act);
      }
    }

    // owner 全量放行（仅限契约声明动作）；字段策略经工厂公开 API 聚合
    const roleNames = await factory.resolveMemberRoleNames(tenantCtx);
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
