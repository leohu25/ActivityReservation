import {
  createMongoAbility,
  type MongoAbility,
  type RawRuleOf,
} from "@casl/ability";
import { FieldPolicy } from "@base/shared";

/**
 * RSC 可序列化的能力快照（官方同构范式的「rules 载体」）。
 */
export interface AbilitySnapshot {
  readonly subject: string;
  readonly actions: readonly string[];
  readonly fieldPolicies?: Readonly<Record<string, string>>;
}

export type AppClientAbility = MongoAbility;

/**
 * 将页面快照编译为 CASL RawRule[]（与旧 plain ability 语义对齐）：
 * - 动作级默认放行（未声明 fields）
 * - HIDDEN：对 read/create/update 使用 inverted fields 规则拒绝
 * - READONLY：对 create/update inverted 拒绝
 * - 未出现在 fieldPolicies 中的字段：默认放行
 */
export function snapshotToRawRules(
  snapshot: AbilitySnapshot,
): RawRuleOf<AppClientAbility>[] {
  const { subject, actions, fieldPolicies } = snapshot;
  const policies = fieldPolicies ?? {};
  const policyKeys = Object.keys(policies);

  const rules: RawRuleOf<AppClientAbility>[] = actions.map((action) => ({
    action,
    subject,
  }));

  if (policyKeys.length === 0) {
    return rules;
  }

  const hiddenFields = policyKeys.filter(
    (field) => policies[field] === FieldPolicy.HIDDEN,
  );
  const readonlyFields = policyKeys.filter(
    (field) => policies[field] === FieldPolicy.READONLY,
  );

  for (const field of hiddenFields) {
    for (const action of ["read", "create", "update"] as const) {
      if (!actions.includes(action)) continue;
      rules.push({ action, subject, fields: [field], inverted: true });
    }
  }

  for (const field of readonlyFields) {
    for (const action of ["create", "update"] as const) {
      if (!actions.includes(action)) continue;
      rules.push({ action, subject, fields: [field], inverted: true });
    }
  }

  return rules;
}

/**
 * 客户端从快照重建真实 CASL Ability（官方 AbilityProvider 消费）。
 */
export function createAbilityFromSnapshot(
  snapshots: AbilitySnapshot | readonly AbilitySnapshot[],
): AppClientAbility {
  const list = Array.isArray(snapshots)
    ? (snapshots as readonly AbilitySnapshot[])
    : [snapshots as AbilitySnapshot];

  const rules = list.flatMap((snapshot) => snapshotToRawRules(snapshot));
  return createMongoAbility<AppClientAbility>(rules);
}
