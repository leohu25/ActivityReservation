import pRetry, { type Options as PRetryOptions } from "p-retry";

/**
 * 判断是否为 Prisma 唯一键冲突错误 (P2002)
 */
export function isPrismaUniqueConstraintError(error: unknown): boolean {
	if (typeof error !== "object" || error === null) return false;
	const directCode = (error as { code?: unknown }).code;
	if (directCode === "P2002") return true;

	const innerError = (error as { error?: unknown }).error;
	if (typeof innerError === "object" && innerError !== null) {
		if ((innerError as { code?: unknown }).code === "P2002") return true;
	}

	const cause = (error as { cause?: unknown }).cause;
	if (typeof cause === "object" && cause !== null) {
		return (cause as { code?: unknown }).code === "P2002";
	}
	return false;
}

export interface RetryUniqueOptions {
	/** 最大尝试次数，默认 3 */
	retries?: number;
	/** 发生可重试冲突时的回调（可选） */
	onRetry?: (error: unknown, attempt: number) => void;
}

/**
 * 针对并发发号/写入时的 Prisma P2002 唯一约束冲突提供工业级指数退避重试。
 * 核心机制（使用成熟库 p-retry）：
 * - 只有 Prisma P2002 错误才进行指数退避重试；
 * - 遇到其他业务异常或非法传参直接中断，绝不盲目重试。
 */
export async function retryOnUniqueConflict<T>(
	fn: () => Promise<T>,
	options: RetryUniqueOptions = {},
): Promise<T> {
	const { retries = 3, onRetry } = options;

	let originalFailure: unknown;

	const retryOptions: PRetryOptions = {
		retries: Math.max(0, retries - 1),
		minTimeout: 20,
		factor: 2,
		shouldRetry: (context) => {
			const rawError = (context as any).error ?? context;
			originalFailure = rawError;

			const isP2002 = isPrismaUniqueConstraintError(rawError);
			if (isP2002) {
				onRetry?.(rawError, context.attemptNumber);
				return true;
			}
			// 非 P2002 错误直接不重试
			return false;
		},
	};

	try {
		return await pRetry(fn, retryOptions);
	} catch (err: unknown) {
		if (originalFailure !== undefined) {
			throw originalFailure;
		}
		throw err;
	}
}
