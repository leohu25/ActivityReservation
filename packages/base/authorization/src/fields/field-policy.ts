import { ForbiddenError } from "@casl/ability";
import type { AnyMongoAbility } from "@casl/ability";
import { permittedFieldsOf } from "@casl/ability/extra";
import { FieldPolicy, type FieldAccessMode } from "@base/shared";

export { FieldPolicy, type FieldAccessMode } from "@base/shared";

/**
 * 角色字段策略配置契约
 */
export interface RoleFieldPolicyConfig {
 readonly role: string;
 readonly subject: string;
 readonly field: string;
 readonly access: FieldAccessMode;
}

/**
 * 字段策略异常
 */
export class FieldPolicyError extends Error {
 constructor(message: string) {
  super(message);
  this.name = "FieldPolicyError";
 }
}

/**
 * 推导指定 Subject 字段的访问模式 (HIDDEN, READONLY, EDITABLE)
 */
export function getFieldMode(
 ability: AnyMongoAbility,
 subject: string,
 field: string,
): FieldAccessMode {
 const readable = ability.can("read", subject, field);
 const editable = ability.can("update", subject, field);

 if (!readable) {
  return FieldPolicy.HIDDEN;
 }
 if (!editable) {
  return FieldPolicy.READONLY;
 }
 return FieldPolicy.EDITABLE;
}

/**
 * 获取当前 Ability 在指定 Subject 上被授权读取的字段列表。
 * 若无特定字段限制（即对 Subject 整体拥有无约束 read 权限），则返回传入的所有候选字段。
 */
export function getReadableFields(
 ability: AnyMongoAbility,
 subject: string,
 candidateFields?: readonly string[],
): string[] {
 const fields = permittedFieldsOf(ability, "read", subject, {
  fieldsFrom: (rule) => rule.fields || [],
 });

 if (fields.length === 0) {
  if (ability.can("read", subject)) {
   return candidateFields ? [...candidateFields] : [];
  }
  return [];
 }

 if (candidateFields && candidateFields.length > 0) {
  return candidateFields.filter((f) => fields.includes(f));
 }
 return fields;
}

/**
 * 获取当前 Ability 在指定 Subject 上被授权更新/写入的字段列表。
 */
export function getEditableFields(
 ability: AnyMongoAbility,
 subject: string,
 candidateFields?: readonly string[],
): string[] {
 const fields = permittedFieldsOf(ability, "update", subject, {
  fieldsFrom: (rule) => rule.fields || [],
 });

 if (fields.length === 0) {
  if (ability.can("update", subject)) {
   return candidateFields ? [...candidateFields] : [];
  }
  return [];
 }

 if (candidateFields && candidateFields.length > 0) {
  return candidateFields.filter((f) => fields.includes(f));
 }
 return fields;
}

/**
 * 过滤对象，仅保留当前 Ability 被授权读取的字段。
 * 隐藏 (HIDDEN) 字段将被彻底剥离，杜绝敏感数据外泄。
 */
export function pickReadableFields<T extends Record<string, unknown>>(
 ability: AnyMongoAbility,
 subject: string,
 record: T,
): Partial<T> {
 const keys = Object.keys(record) as Array<keyof T & string>;
 const readable = getReadableFields(ability, subject, keys);
 const readableSet = new Set(readable);

 const result: Partial<T> = {};
 for (const key of keys) {
  if (readableSet.has(key)) {
   result[key] = record[key];
  }
 }
 return result;
}

/**
 * 校验写入/更新 Payload 是否仅包含允许编辑的字段。
 * 若 Payload 中携带任何只读 (READONLY) 或隐藏 (HIDDEN) 字段，立即抛出 CASL ForbiddenError 明确拒绝。
 */
export function assertEditableFields<T extends Record<string, unknown>>(
 ability: AnyMongoAbility,
 subject: string,
 payload: T,
): void {
 const keys = Object.keys(payload);
 const editable = getEditableFields(ability, subject, keys);
 const editableSet = new Set(editable);

 const forbiddenKeys = keys.filter((key) => !editableSet.has(key));
 if (forbiddenKeys.length > 0) {
  const error = ForbiddenError.from(ability);
  error.setMessage(
   `禁止修改 ${subject} 的非编辑或隐藏字段: ${forbiddenKeys.join(", ")}`,
  );
  throw error;
 }
}

/**
 * 推导字段访问三态（角色配置 UI 与 Ability 编译共用的单一规则）。
 *
 * 规则：
 * 1. 已有显式 fieldPolicy → 直接采用
 * 2. 有写动作 (create/update) → EDITABLE
 * 3. 仅有读动作 (read) → READONLY
 * 4. 否则 → HIDDEN
 *
 * 与 `computeAllowedFields` / `getFieldMode` 语义对齐：HIDDEN 任何操作剥离；
 * READONLY 可读不可写；EDITABLE 可读可写。
 */
export function resolveFieldAccess(input: {
 readonly explicit?: FieldAccessMode | null;
 readonly hasRead?: boolean;
 readonly hasWrite?: boolean;
}): FieldAccessMode {
 if (input.explicit) {
  return input.explicit;
 }
 if (input.hasWrite) {
  return FieldPolicy.EDITABLE;
 }
 if (input.hasRead) {
  return FieldPolicy.READONLY;
 }
 return FieldPolicy.HIDDEN;
}

/**
 * 前端 plain ability 的字段级判定（实现收敛至 @base/shared，此处再导出保持领域包 API 稳定）。
 */
export {
 createSubjectAbility,
 isFieldAllowedForAction,
 type SubjectAbilityLike,
 type SubjectPermissionsPayload,
} from "@base/shared";

/**
 * 通用字段可见性生成器 (Field Visibility Map Generator)
 * 遍历指定 Subject 的目标受控字段清单，调用 CASL Ability 的 can('read', subject, field)
 * 快速生成强类型的字段可读性状态映射对象 { [field]: boolean }，供前端页面或视图层直接解构消费。
 *
 * @param ability 具有 can(action, subject, field) 接口的 Ability 实例
 * @param subject 目标实体 Subject 标识 (如 "PurchaseOrder")
 * @param fields 目标受控字段名称数组
 * @returns 字段可见性映射对象
 */
export function getFieldVisibility<TField extends string>(
 ability: { can(action: string, subject: string, field?: string): boolean },
 subject: string,
 fields: readonly TField[],
): Record<TField, boolean> {
 const visibility = {} as Record<TField, boolean>;
 for (const field of fields) {
  visibility[field] = ability.can("read", subject, field);
 }
 return visibility;
}
