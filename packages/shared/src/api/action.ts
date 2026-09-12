/**
 * @base/shared - Next.js Server Action 统一安全包装契约
 */
import { toPlainData } from "../index";

export type ServerActionResult<T> =
 | { readonly success: true; readonly data: T }
 | { readonly success: false; readonly error: string };

/**
 * 统一 Next.js Server Action 包装工厂 (防线一)
 * 1. 自动执行 toPlainData (基于 superjson) 彻底消除 Decimal / Date 跨端序列化报错
 * 2. 自动捕获服务端异常，统一转换为标准的 ServerActionResult 契约
 * 3. 彻底消除业务层重复冗余的 try-catch，让开发者专注纯数据业务逻辑
 *
 * @param actionFn 业务异步逻辑函数 (支持任意参数个数)
 * @param defaultErrorMessage 异常兜底提示文案
 */
export function defineServerAction<TArgs extends readonly unknown[], TReturn>(
 actionFn: (...args: TArgs) => Promise<TReturn>,
 defaultErrorMessage = "操作执行失败，请稍后重试",
): (...args: TArgs) => Promise<ServerActionResult<TReturn>> {
 return async (...args: TArgs): Promise<ServerActionResult<TReturn>> => {
  try {
   const result = await actionFn(...args);
   return {
    success: true,
    data: toPlainData(result),
   };
  } catch (err: unknown) {
   const message = err instanceof Error ? err.message : defaultErrorMessage;
   return {
    success: false,
    error: message || defaultErrorMessage,
   };
  }
 };
}
