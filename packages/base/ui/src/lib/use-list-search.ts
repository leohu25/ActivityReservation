"use client";

import { useMemo, useState, useTransition } from "react";
import { useQueryStates, throttle } from "nuqs";
import {
  type DefinedListSearchParams,
  type ListSearchParamsValues,
} from "./list-search-params";

export interface UseListSearchResult {
  readonly params: ListSearchParamsValues;
  readonly patch: (
    partial: Record<string, unknown>,
    options?: { resetPage?: boolean },
  ) => void;
  readonly setParams: (partial: Record<string, unknown>) => void;
  readonly keywordDraft: string;
  readonly setKeywordDraft: (v: string) => void;
  readonly isPending: boolean;
  readonly dataTableProps: {
    page: number;
    pageSize: number;
    keywordValue: string;
    isLoading: boolean;
    onPageChange: (page: number, pageSize: number) => void;
    onKeywordChange: (v: string) => void;
    onSearch: () => void;
    onReset: () => void;
    onRefresh: () => void;
  };
}

/**
 * 列表 URL 状态 Hook。
 * 配合 `defineListSearchParams`（server-safe）使用；本 Hook 仅在 Client 组件中调用。
 */
export function useListSearch(
  defined: DefinedListSearchParams,
): UseListSearchResult {
  const [isPending, startTransition] = useTransition();
  const [params, setParamsRaw] = useQueryStates(defined.parsers as never, {
    shallow: false,
    startTransition,
    limitUrlUpdates: throttle(300),
  }) as unknown as [
    ListSearchParamsValues,
    (partial: Record<string, unknown>) => void,
  ];

  const [keywordDraft, setKeywordDraft] = useState(params.keyword ?? "");

  const setParams = useMemo(
    () => (partial: Record<string, unknown>) => setParamsRaw(partial),
    [setParamsRaw],
  );

  const patch = useMemo(
    () =>
      (
        partial: Record<string, unknown>,
        options?: { resetPage?: boolean },
      ) => {
        const resetPage = options?.resetPage ?? true;
        setParamsRaw({
          ...partial,
          ...(resetPage ? { page: 1 } : null),
        });
      },
    [setParamsRaw],
  );

  const dataTableProps = useMemo(
    () => ({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
      keywordValue: keywordDraft,
      isLoading: isPending,
      onPageChange: (page: number, pageSize: number) => {
        setParamsRaw({ page, pageSize });
      },
      onKeywordChange: setKeywordDraft,
      onSearch: () => {
        patch({ keyword: keywordDraft.trim() });
      },
      onReset: () => {
        setKeywordDraft("");
        const reset: Record<string, unknown> = {
          page: 1,
          pageSize: 10,
          keyword: "",
        };
        for (const key of Object.keys(defined.extensions)) {
          reset[key] = typeof key === "string" ? "" : "";
        }
        setParamsRaw(reset);
      },
      onRefresh: () => {
        setParamsRaw({ ...params });
      },
    }),
    [params, keywordDraft, isPending, setParamsRaw, patch, defined.extensions],
  );

  return {
    params,
    patch,
    setParams,
    keywordDraft,
    setKeywordDraft,
    isPending,
    dataTableProps,
  };
}
