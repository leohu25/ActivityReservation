/**
 * @chenrun/shared - 全局通用 TypeScript 类型定义与辅助工具
 */

/**
 * 深度可选递归类型
 */
export type DeepPartial<T> = T extends Function
 ? T
 : T extends Array<infer U>
   ? _DeepPartialArray<U>
   : T extends object
     ? _DeepPartialObject<T>
     : T | undefined;

type _DeepPartialArray<T> = Array<DeepPartial<T>>;
type _DeepPartialObject<T> = { [P in keyof T]?: DeepPartial<T[P]> };

/**
 * 可空包装类型
 */
export type Nullable<T> = T | null;

/**
 * 可空或未定义包装类型
 */
export type Maybe<T> = T | null | undefined;

/**
 * 提取对象的值类型联合
 */
export type ValueOf<T> = T[keyof T];

/**
 * 提取异步函数的 Promise 返回值类型
 */
export type AsyncReturnType<
 T extends (...args: readonly any[]) => Promise<unknown>,
> = T extends (...args: readonly any[]) => Promise<infer R> ? R : never;

/**
 * 要求属性联合中至少出现指定键之一
 */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
 T,
 Exclude<keyof T, Keys>
> &
 {
  [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
 }[Keys];
