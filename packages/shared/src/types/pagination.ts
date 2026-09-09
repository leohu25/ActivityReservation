/**
 * @chenrun/shared - 分页请求参数与标准化分页结果
 */

import { DEFAULT_PAGINATION } from "../constants";

export interface PaginationParams {
  readonly page?: number;
  readonly pageSize?: number;
}

export interface NormalizedPagination {
  readonly page: number;
  readonly pageSize: number;
  readonly skip: number;
  readonly take: number;
}

export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly hasNext: boolean;
  readonly hasPrev: boolean;
}

/**
 * 标准化并清洗分页参数（处理越界、负数与非法值）
 */
export function normalizePagination(
  params?: PaginationParams,
): NormalizedPagination {
  const rawPage = params?.page ?? DEFAULT_PAGINATION.PAGE;
  const rawPageSize = params?.pageSize ?? DEFAULT_PAGINATION.PAGE_SIZE;

  const page = Math.max(1, Math.floor(Number.isFinite(rawPage) ? rawPage : 1));
  const boundedSize = Math.max(
    1,
    Math.min(
      DEFAULT_PAGINATION.MAX_PAGE_SIZE,
      Math.floor(
        Number.isFinite(rawPageSize)
          ? rawPageSize
          : DEFAULT_PAGINATION.PAGE_SIZE,
      ),
    ),
  );

  return {
    page,
    pageSize: boundedSize,
    skip: (page - 1) * boundedSize,
    take: boundedSize,
  };
}

/**
 * 构建标准化分页响应包
 */
export function createPaginatedResult<T>(
  items: readonly T[],
  total: number,
  params: { readonly page: number; readonly pageSize: number },
): PaginatedResult<T> {
  const safeTotal = Math.max(0, total);
  const totalPages =
    params.pageSize > 0 ? Math.ceil(safeTotal / params.pageSize) : 0;

  return {
    items,
    total: safeTotal,
    page: params.page,
    pageSize: params.pageSize,
    totalPages,
    hasNext: params.page < totalPages,
    hasPrev: params.page > 1 && totalPages > 0,
  };
}
