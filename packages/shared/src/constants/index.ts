/**
 * @base/shared - 全局通用枚举与常量定义
 */

/**
 * 字段访问控制策略三态 (Field Policy)
 * 决定字段在前后端的展示与修改权限
 */
export const FieldPolicy = {
 /** 剥离隐藏，对当前操作员不可见 */
 HIDDEN: "HIDDEN",
 /** 只读锁定，可见但不可编辑/不可修改 */
 READONLY: "READONLY",
 /** 正常交互编辑 */
 EDITABLE: "EDITABLE",
} as const;

export type FieldPolicy = (typeof FieldPolicy)[keyof typeof FieldPolicy];

/** 跨授权引擎与通用 UI 组件共享的字段访问三态类型。 */
export type FieldAccessMode = FieldPolicy;

/**
 * 分页默认参数与阈值
 */
export const DEFAULT_PAGINATION = {
 /** 默认初始页码 */
 PAGE: 1,
 /** 默认每页记录数 */
 PAGE_SIZE: 20,
 /** 单次查询允许的最大每页记录数 */
 MAX_PAGE_SIZE: 100,
} as const;
