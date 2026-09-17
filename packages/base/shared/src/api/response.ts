/**
 * @base/shared - 统一 HTTP API 响应契约与工厂
 */

export interface ApiSuccessResponse<T = unknown> {
  readonly success: true;
  readonly data: T;
  readonly meta?: Record<string, unknown>;
}

export interface ApiErrorDetail {
  readonly code: string;
  readonly message: string;
  readonly status?: number;
  readonly details?: unknown;
}

export interface ApiErrorResponse {
  readonly success: false;
  readonly error: ApiErrorDetail;
}

/**
 * 统一 API 响应格式
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * 构造标准 API 成功返回
 */
export function apiSuccess<T>(
  data: T,
  meta?: Record<string, unknown>,
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };
}

/**
 * 构造标准 API 错误返回
 */
export function apiError(
  code: string,
  message: string,
  status: number = 400,
  details?: unknown,
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      status,
      ...(details === undefined ? {} : { details }),
    },
  };
}
