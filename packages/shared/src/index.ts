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

// 成熟三方工具套件统一导出与封装
export * as radash from "radash";
export { default as dayjs } from "dayjs";
export { default as superjson } from "superjson";
import { Decimal } from "decimal.js";
import superjson from "superjson";

/**
 * 遵循 superjson 官方规范注册 Decimal.js / Prisma.Decimal 自定义类型
 * 参考官方文档: https://github.com/flightcontrolhq/superjson#decimaljs--prismadecimal
 */
superjson.registerCustom<Decimal, string>(
 {
  isApplicable: (v): v is Decimal => Decimal.isDecimal(v),
  serialize: (v) => v.toJSON(),
  deserialize: (v) => new Decimal(v),
 },
 "decimal.js",
);

/**
 * 专为 Next.js RSC 服务端与客户端边界打造的安全数据平铺转换器
 * 100% 依托官方 superjson 核心能力，将 Decimal、Date、Map、Set 原生转换为 RSC 合规 Plain Object
 * 彻底解决 Next.js 控制台报错 "Only plain objects can be passed to Client Components. Decimal objects are not supported"
 */
export function toPlainData<T>(data: T): T {
 if (data === null || data === undefined) return data;
 try {
  const { json } = superjson.serialize(data);
  return json as T;
 } catch {
  return data;
 }
}
