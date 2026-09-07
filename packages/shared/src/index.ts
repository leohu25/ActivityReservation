/**
 * @chenrun/shared
 * 核心共享枚举、全局常量与基础错误定义
 */

export enum DataScope {
  SELF = "SELF",
  DEPT = "DEPT",
  DEPT_TREE = "DEPT_TREE",
  CUSTOM_DEPT = "CUSTOM_DEPT",
  ALL = "ALL",
}

export enum FieldPolicy {
  HIDDEN = "HIDDEN",
  READONLY = "READONLY",
  EDITABLE = "EDITABLE",
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}
