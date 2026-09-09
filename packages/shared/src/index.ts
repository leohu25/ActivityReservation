/**
 * @chenrun/shared - 企业级 SaaS ERP 全局共享能力底座
 *
 * 模块清单:
 * - constants  : 全局枚举 (DataScope, FieldPolicy, AuditStatus, TenantStatus 等) 与常量
 * - errors     : 统一异常体系 (AppError, BusinessError, NotFoundError, UnauthorizedError 等)
 * - result     : 函数式 Result/Either (ok, err, isOk, isErr, tryCatch, unwrap)
 * - api        : 统一 API 响应包装契约与工厂 (apiSuccess, apiError)
 * - pagination : 标准分页参数与响应结构 (normalizePagination, createPaginatedResult)
 * - format     : 货币金额、百分比、日期时间、数值与容量格式化
 * - mask       : 敏感资产数据脱敏 (maskPhone, maskEmail, maskIdCard, maskBankCard, maskName)
 * - tree       : 组织部门拓扑树形结构转换与遍历 (buildTree, flattenTree, findTreeNode, collectSubtreeIds)
 * - collection : 集合操作纯函数 (groupBy, keyBy, chunk, uniqBy, pick, omit)
 * - validation : 统一社会信用代码、手机号、邮箱合规校验
 * - types      : 通用 TypeScript 类型工具
 */

export * from "./constants";
export * from "./errors";
export * from "./result";
export * from "./api";
export * from "./pagination";
export * from "./format";
export * from "./mask";
export * from "./tree";
export * from "./collection";
export * from "./validation";
export * from "./types";
