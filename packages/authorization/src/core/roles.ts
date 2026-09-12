/**
 * 系统内置角色标识常量与类型定义
 *
 * 规范：禁止业务模块分散维护内置角色字符串。
 * 平台授权引擎 (CaslAbilityFactory) 与业务模块统一由此处导入。
 */
export const BUILT_IN_ROLES = ["owner", "admin", "member"] as const;

export type BuiltInRole = (typeof BUILT_IN_ROLES)[number];

/**
 * 判断指定角色标识是否为系统内置角色
 */
export function isBuiltInRole(role: string): role is BuiltInRole {
 return (BUILT_IN_ROLES as readonly string[]).includes(role);
}
