import { accessibleBy, type PrismaAbility } from "@casl/prisma";
import type { PrismaQueryCondition } from "../scopes/data-scope";

interface CanCheckable {
  can(action: string, subject: string): boolean;
}

interface OfTypeAccessible {
  ofType(subject: string): PrismaQueryCondition;
}

interface CaslPrismaOrCondition {
  readonly OR?: readonly unknown[];
}

/**
 * 校验对象是否包含空 OR 数组（@casl/prisma 拒绝访问时的特征返回值）
 */
function isEmptyOrCondition(condition: PrismaQueryCondition): boolean {
  const candidate = condition as CaslPrismaOrCondition;
  return Array.isArray(candidate.OR) && candidate.OR.length === 0;
}

/**
 * 从 CASL PrismaAbility 中通过 @casl/prisma 的 accessibleBy 提取指定 Subject 的 Prisma where 查询条件。
 * 当 Ability 规则中包含数据范围条件时，直接下推为 Prisma 条件对象。
 * 若无权限或匹配失败，一律 Fail-Closed 返回拒绝条件 ({ AND: [{ id: "__NO_PERMISSION_FAIL_CLOSED__" }] })。
 */
export function getAccessibleWhere<
  TAbility extends PrismaAbility<[string, string]>,
>(
  ability: TAbility,
  subject: string,
  action: string = "read",
): PrismaQueryCondition {
  try {
    // SAFETY: accessibleBy 需要接受特定泛型能力，此处传入 TAbility 并在未知 action 时安全降级
    const accessible = accessibleBy(ability, action as never);
    // SAFETY: AccessibleRecords 在运行时提供基于 Subject 模型的属性访问器与动态 Getter
    const records = accessible as unknown as Record<
      string,
      PrismaQueryCondition
    >;
    // SAFETY: AccessibleRecords 具备 ofType(subject) 方法可显式获取该 Subject 的条件对象
    const ofTypeRecords = accessible as unknown as OfTypeAccessible;
    const where =
      records[subject] ??
      (typeof ofTypeRecords.ofType === "function"
        ? ofTypeRecords.ofType(subject)
        : undefined);

    // @casl/prisma 在无权限或完全被拒绝时返回 { OR: [] }，需要对其统一归一化为标准的 Fail-Closed 过滤条件
    if (where) {
      if (isEmptyOrCondition(where)) {
        return { AND: [{ id: "__NO_PERMISSION_FAIL_CLOSED__" }] };
      }
      return where;
    }

    // SAFETY: PrismaAbility 在运行时实现标准 CASL can(action, subject) 接口，用于判定是否具有无约束权限
    const checkable = ability as unknown as CanCheckable;
    if (typeof checkable.can === "function" && checkable.can(action, subject)) {
      return {};
    }

    // 默认关闭 (Fail-Closed)
    return { AND: [{ id: "__NO_PERMISSION_FAIL_CLOSED__" }] };
  } catch {
    return { AND: [{ id: "__NO_PERMISSION_FAIL_CLOSED__" }] };
  }
}
