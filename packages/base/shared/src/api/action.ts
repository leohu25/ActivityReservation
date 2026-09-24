/**
 * @base/shared - Next.js Server Action 统一安全包装契约
 */
import { toPlainData } from "../index";

export type ServerActionResult<T> =
	| { readonly success: true; readonly data: T }
	| { readonly success: false; readonly error: string };

/**
 * 智能解析并提取 Zod / 运行时校验异常为人类可读的中文提示
 */
export function formatErrorMessage(err: unknown, defaultMsg = "操作执行失败，请稍后重试"): string {
	if (!err) return defaultMsg;

	// 1. 直接是 ZodError 实例或携带 issues 数组的对象
	const errObj = err as { name?: string; issues?: Array<{ path?: (string | number)[]; message?: string }> };
	if (errObj && (errObj.name === "ZodError" || Array.isArray(errObj.issues))) {
		if (Array.isArray(errObj.issues) && errObj.issues.length > 0) {
			const msgs = errObj.issues.map((issue) => {
				const path = issue.path ?? [];
				if (path.length >= 2 && typeof path[1] === "number") {
					return `第 ${path[1] + 1} 行: ${issue.message || "校验未通过"}`;
				}
				if (path.length >= 1 && typeof path[0] === "number") {
					return `第 ${path[0] + 1} 行: ${issue.message || "校验未通过"}`;
				}
				return issue.message || "字段校验未通过";
			});
			return Array.from(new Set(msgs)).join("；");
		}
	}

	const rawMsg = err instanceof Error ? err.message : String(err);

	// 2. 防御：若错误信息本身是被序列化的 Zod issues JSON 字符串（如 "[{...}]"）
	if (typeof rawMsg === "string" && rawMsg.trim().startsWith("[") && rawMsg.trim().endsWith("]")) {
		try {
			const parsed = JSON.parse(rawMsg.trim());
			if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.message) {
				const msgs = parsed.map((issue: { path?: (string | number)[]; message?: string }) => {
					const path = issue.path ?? [];
					if (path.length >= 2 && typeof path[1] === "number") {
						return `第 ${path[1] + 1} 行: ${issue.message || "校验未通过"}`;
					}
					if (path.length >= 1 && typeof path[0] === "number") {
						return `第 ${path[0] + 1} 行: ${issue.message || "校验未通过"}`;
					}
					return issue.message || "字段校验未通过";
				});
				return Array.from(new Set(msgs)).join("；");
			}
		} catch {
			// 不是合法 JSON 则忽略
		}
	}

	return rawMsg || defaultMsg;
}

/**
 * 统一 Next.js Server Action 包装工厂 (防线一)
 * 1. 自动执行 toPlainData (基于 superjson) 彻底消除 Decimal / Date 跨端序列化报错
 * 2. 自动捕获服务端异常，统一转换为标准的 ServerActionResult 契约并提取友好错误信息
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
			const message = formatErrorMessage(err, defaultErrorMessage);
			return {
				success: false,
				error: message,
			};
		}
	};
}
