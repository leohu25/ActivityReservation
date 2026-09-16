import { FieldPolicy } from "../constants";

/**
 * RSC 下发的 Subject 权限纯数据（可序列化，禁止携带 CASL 实例）。
 */
export interface SubjectPermissionsPayload {
  readonly actions: readonly string[];
  readonly fieldPolicies?: Readonly<Record<string, string>>;
}

/**
 * 与 CASL `can()` 对齐的最小 Ability 接口（plain object，可供 UI 消费）。
 */
export interface SubjectAbilityLike {
  can(action: string, subject?: string, field?: string): boolean;
}

/**
 * 前端 plain ability 的字段级判定（与 CASL 字段规则对齐）。
 * HIDDEN 剥离；create/update 遇 READONLY 拒绝。
 */
export function isFieldAllowedForAction(
  fieldPolicies: Readonly<Record<string, string>> | undefined,
  action: string,
  field?: string,
): boolean {
  if (!field) {
    return true;
  }
  const mode = fieldPolicies?.[field];
  if (mode === FieldPolicy.HIDDEN) {
    return false;
  }
  if (
    (action === "create" || action === "update") &&
    mode === FieldPolicy.READONLY
  ) {
    return false;
  }
  return true;
}

/**
 * 从 RSC 纯数据权限重建页面 Subject 的 plain Ability（唯一实现，消除各 View/DataTable 重复 shim）。
 *
 * Fail-Closed 约定：
 * - `permissions` 缺失 → 返回 `undefined`（调用方应按无权限处理，禁止放行）；
 * - subject 不匹配 → 拒绝；
 * - action 未在 `actions` 白名单 → 拒绝；
 * - 字段策略按 `isFieldAllowedForAction` 对齐 CASL。
 */
export function createSubjectAbility(
  permissions: SubjectPermissionsPayload | null | undefined,
  subject: string,
): SubjectAbilityLike | undefined {
  if (!permissions) {
    return undefined;
  }

  const actions = permissions.actions;
  const fieldPolicies = permissions.fieldPolicies;

  return {
    can(action: string, targetSubject?: string, field?: string): boolean {
      if (targetSubject && targetSubject !== subject) {
        return false;
      }
      if (!actions.includes(action)) {
        return false;
      }
      return isFieldAllowedForAction(fieldPolicies, action, field);
    },
  };
}
