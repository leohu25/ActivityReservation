/**
 * @chenrun/shared - 系统统一错误体系
 */

/**
 * 基础应用异常
 */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * 业务规则校验与处理异常 (HTTP 400)
 */
export class BusinessError extends AppError {
  constructor(
    message: string,
    code: string = "BUSINESS_ERROR",
    details?: unknown,
  ) {
    super(code, message, 400, details);
    this.name = "BusinessError";
  }
}

/**
 * 未认证异常 (HTTP 401)
 */
export class UnauthorizedError extends AppError {
  constructor(
    message: string = "会话无效或未登录",
    code: string = "UNAUTHORIZED",
  ) {
    super(code, message, 401);
    this.name = "UnauthorizedError";
  }
}

/**
 * 权限不足/禁止访问异常 (HTTP 403)
 */
export class ForbiddenError extends AppError {
  constructor(
    message: string = "无权访问此资源",
    code: string = "FORBIDDEN",
    details?: unknown,
  ) {
    super(code, message, 403, details);
    this.name = "ForbiddenError";
  }
}

/**
 * 资源不存在异常 (HTTP 404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const msg =
      identifier === undefined
        ? `未找到请求的 ${resource}`
        : `未找到指定的 ${resource} (标识: ${identifier})`;
    super("NOT_FOUND", msg, 404, { resource, identifier });
    this.name = "NotFoundError";
  }
}

/**
 * 资源冲突或唯一性约束异常 (HTTP 409)
 */
export class ConflictError extends AppError {
  constructor(message: string, code: string = "CONFLICT", details?: unknown) {
    super(code, message, 409, details);
    this.name = "ConflictError";
  }
}

/**
 * 输入参数或字段格式校验异常 (HTTP 422)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super("VALIDATION_ERROR", message, 422, details);
    this.name = "ValidationError";
  }
}

/**
 * 租户业务准入门禁拦截异常 (HTTP 403)
 */
export class TenantAccessError extends AppError {
  constructor(
    message: string,
    code: string = "TENANT_ACCESS_DENIED",
    details?: unknown,
  ) {
    super(code, message, 403, details);
    this.name = "TenantAccessError";
  }
}

/**
 * 判断某个未知异常是否属于本体系 AppError
 */
export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
