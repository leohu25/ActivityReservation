/**
 * @chenrun/shared - 企业级 SaaS ERP 全局共享能力底座
 *
 * 领域结构规范:
 * - constants : 真正跨模块共享的稳定常量与契约
 * - errors    : 统一异常体系 (AppError, BusinessError, NotFoundError, UnauthorizedError 等)
 * - api       : API 契约与函数式单子 (ApiResponse, apiSuccess, apiError, Result/Either)
 * - types     : 通用 TypeScript 类型与分页契约 (PaginatedResult, PaginationParams 等)
 * - utils     : 纯函数工具套件 (format, tree, mask, collection, validation)
 */

export * from "./constants";
export * from "./errors";
export * from "./api";
export * from "./types";
export * from "./utils";
