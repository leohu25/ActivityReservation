"use client";

import * as React from "react";
import { useListUrlNav, type ListUrlPatch } from "./use-list-url-nav";

export interface UseDataTableStateOptions {
  /** 初始页码，默认 1 */
  initialPage?: number;
  /** 初始每页条数，默认 10 */
  initialPageSize?: number;
  /** 初始总条数 */
  initialTotal?: number;
  /** 初始搜索关键字，默认 "" */
  initialKeyword?: string;
  /** 自定义扩展额外筛选参数初始值（如 status, category 等） */
  initialExtraFilters?: Record<string, string | number | undefined | null>;
  /** 当搜索触发时触发的外部异步拉取回调（如 Server Action 查询） */
  onFetchData?: (params: {
    page: number;
    pageSize: number;
    keyword?: string;
    extraFilters?: Record<string, string | number | undefined | null>;
  }) => void | Promise<void>;
  /** 是否自动同步到 URL 查询参数，默认 true */
  syncUrl?: boolean;
}

/**
 * @deprecated 请改用 `defineListSearchParams`（contract.ts）+ `useListSearch`，
 * 并将 `{...list.dataTableProps}` 绑定到 `DataTable`。
 * 本 Hook 依赖已废弃的 `useListUrlNav`，仅作存量迁移过渡，新代码禁止使用。
 */
export function useDataTableState(options: UseDataTableStateOptions = {}) {
  const {
    initialPage = 1,
    initialPageSize = 10,
    initialTotal = 0,
    initialKeyword = "",
    initialExtraFilters = {},
    onFetchData,
    syncUrl = true,
  } = options;

  const { navigateList, router } = useListUrlNav({
    defaultPage: 1,
    defaultPageSize: 10,
  });

  const [page, setPage] = React.useState(initialPage);
  const [pageSize, setPageSize] = React.useState(initialPageSize);
  const [total, setTotal] = React.useState(initialTotal);
  const [keyword, setKeyword] = React.useState(initialKeyword);
  const [extraFilters, setExtraFilters] =
    React.useState<Record<string, string | number | undefined | null>>(
      initialExtraFilters,
    );

  // 当 Server Component 传入新的 Props 时同步响应
  React.useEffect(() => {
    setPage(initialPage);
    setPageSize(initialPageSize);
    setTotal(initialTotal);
    setKeyword(initialKeyword);
  }, [initialPage, initialPageSize, initialTotal, initialKeyword]);

  const setExtraFilter = React.useCallback(
    (key: string, value: string | number | undefined | null) => {
      setExtraFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const triggerQuery = React.useCallback(
    (
      targetPage: number,
      targetPageSize: number,
      targetKeyword: string,
      targetExtra: Record<string, string | number | undefined | null>,
    ) => {
      const trimmedKw = targetKeyword.trim();
      const patch: ListUrlPatch = {
        page: targetPage,
        pageSize: targetPageSize,
        keyword: trimmedKw || undefined,
        ...targetExtra,
      };

      if (syncUrl) {
        navigateList(patch);
      }

      onFetchData?.({
        page: targetPage,
        pageSize: targetPageSize,
        keyword: trimmedKw || undefined,
        extraFilters: targetExtra,
      });
    },
    [syncUrl, navigateList, onFetchData],
  );

  const handleSearch = React.useCallback(() => {
    setPage(1);
    triggerQuery(1, pageSize, keyword, extraFilters);
  }, [pageSize, keyword, extraFilters, triggerQuery]);

  const handleReset = React.useCallback(() => {
    setKeyword("");
    setPage(1);
    const clearedExtra: Record<string, undefined> = {};
    for (const key of Object.keys(extraFilters)) {
      clearedExtra[key] = undefined;
    }
    setExtraFilters(clearedExtra);
    triggerQuery(1, pageSize, "", clearedExtra);
  }, [pageSize, extraFilters, triggerQuery]);

  const handlePageChange = React.useCallback(
    (nextPage: number, nextPageSize: number) => {
      setPage(nextPage);
      setPageSize(nextPageSize);
      triggerQuery(nextPage, nextPageSize, keyword, extraFilters);
    },
    [keyword, extraFilters, triggerQuery],
  );

  const handleRefresh = React.useCallback(() => {
    router?.refresh();
    triggerQuery(page, pageSize, keyword, extraFilters);
  }, [router, page, pageSize, keyword, extraFilters, triggerQuery]);

  /** 供 DataTable 模板直接解构展开的属性包 */
  const bindProps = React.useMemo(
    () => ({
      page,
      pageSize,
      total,
      keywordValue: keyword,
      onKeywordChange: setKeyword,
      onPageChange: handlePageChange,
      onSearch: handleSearch,
      onReset: handleReset,
      onRefresh: handleRefresh,
    }),
    [
      page,
      pageSize,
      total,
      keyword,
      handlePageChange,
      handleSearch,
      handleReset,
      handleRefresh,
    ],
  );

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    total,
    setTotal,
    keyword,
    setKeyword,
    extraFilters,
    setExtraFilter,
    setExtraFilters,
    handleSearch,
    handleReset,
    handlePageChange,
    handleRefresh,
    bindProps,
  };
}
