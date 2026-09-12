/**
 * @base/shared - 函数式 Result/Either 单子与错误处理
 */

export type Ok<T> = {
 readonly success: true;
 readonly value: T;
};

export type Err<E> = {
 readonly success: false;
 readonly error: E;
};

export type Result<T, E = Error> = Ok<T> | Err<E>;

/**
 * 构造成功结果
 */
export function ok<T>(value: T): Ok<T> {
 return { success: true, value };
}

/**
 * 构造失败结果
 */
export function err<E>(error: E): Err<E> {
 return { success: false, error };
}

/**
 * 类型守卫：判定结果是否成功
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
 return result.success;
}

/**
 * 类型守卫：判定结果是否失败
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
 return !result.success;
}

/**
 * 解包结果：成功返回值，失败则抛出异常
 */
export function unwrap<T, E>(result: Result<T, E>): T {
 if (result.success) {
  return result.value;
 }
 if (result.error instanceof Error) {
  throw result.error;
 }
 throw new Error(String(result.error));
}

/**
 * 解包结果：成功返回值，失败则返回提供的默认值
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
 return result.success ? result.value : defaultValue;
}

/**
 * 执行同步可能抛出异常的函数并封装为 Result
 */
export function tryCatch<T>(fn: () => T): Result<T, Error> {
 try {
  return ok(fn());
 } catch (error: unknown) {
  return err(error instanceof Error ? error : new Error(String(error)));
 }
}

/**
 * 执行异步可能抛出异常的函数并封装为 Result
 */
export async function tryCatchAsync<T>(
 fn: () => Promise<T>,
): Promise<Result<T, Error>> {
 try {
  const value = await fn();
  return ok(value);
 } catch (error: unknown) {
  return err(error instanceof Error ? error : new Error(String(error)));
 }
}
