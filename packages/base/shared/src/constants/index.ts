/**
 * @base/shared - 全局通用枚举与常量定义
 */

/**
 * ADR-009 审计外键统一使用 UUIDv7 (@db.Uuid)。
 * 系统级写入（无登录用户/脚本）保留的固定操作者 UUID，替代历史字符串哨兵 "system"。
 */
export const SYSTEM_ACTOR_ID = "00000000-0000-7000-8000-000000000000";

/**
 * Fail-Closed 不可命中 UUID：UUID 列上替代 `"__NO_*_FAIL_CLOSED__"` 非法字符串哨兵。
 * 业务主键为 uuid(7)，该 nil UUID 永不落库，因此条件恒不命中。
 */
export const FAIL_CLOSED_ID = "00000000-0000-0000-0000-000000000000";

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
 * 主数据通用启停生命周期状态常量 (Master Data Status)
 * 适用于客户、门店、物料分类、业务标签等各类基础主数据实体
 */
export const MasterDataStatus = {
 /** 正常启用 / 生效 */
 ACTIVE: "ACTIVE",
 /** 已停用 / 禁用 */
 DISABLED: "DISABLED",
} as const;

export type MasterDataStatus =
 (typeof MasterDataStatus)[keyof typeof MasterDataStatus];

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
