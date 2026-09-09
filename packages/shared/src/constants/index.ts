/**
 * @chenrun/shared - 全局通用枚举与常量定义
 */

/**
 * 数据管辖范围枚举 (Data Scope)
 * 决定查询与操作下推到数据库时的可见范围条件
 */
export enum DataScope {
 /** 仅本人可见/可操作 */
 SELF = "SELF",
 /** 仅本部门可见/可操作 */
 DEPT = "DEPT",
 /** 本部门及所有下级子部门层级树 */
 DEPT_TREE = "DEPT_TREE",
 /** 自定义指定部门枚举列表 */
 CUSTOM_DEPT = "CUSTOM_DEPT",
 /** 全公司全量可见 (无过滤约束) */
 ALL = "ALL",
}

/**
 * 字段访问控制策略三态 (Field Policy)
 * 决定字段在前后端的展示与修改权限
 */
export enum FieldPolicy {
 /** 剥离隐藏，对当前操作员不可见 */
 HIDDEN = "HIDDEN",
 /** 只读锁定，可见但不可编辑/不可修改 */
 READONLY = "READONLY",
 /** 正常交互编辑 */
 EDITABLE = "EDITABLE",
}

/**
 * 业务单据审核状态枚举
 */
export enum AuditStatus {
 /** 待审核 / 审核中 */
 PENDING = "PENDING",
 /** 审核通过 */
 APPROVED = "APPROVED",
 /** 审核驳回 / 已拒绝 */
 REJECTED = "REJECTED",
}

/**
 * 租户物理库与组织生命周期状态
 */
export enum TenantStatus {
 /** 正常可用 */
 ACTIVE = "ACTIVE",
 /** 已暂停 / 欠费或安全风控锁定 */
 SUSPENDED = "SUSPENDED",
 /** 已注销 / 物理库准备释放 */
 TERMINATED = "TERMINATED",
}

/**
 * 员工组织档案在职状态
 */
export enum EmployeeStatus {
 /** 在职 (正常参与业务与准入门禁) */
 ACTIVE = "ACTIVE",
 /** 停用 / 休假挂起 */
 SUSPENDED = "SUSPENDED",
 /** 离职 (触发 Fail-Closed 业务阻断) */
 TERMINATED = "TERMINATED",
}

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
