"use client";

import * as React from "react";
import { useSafeRouter } from "./use-safe-router";

export type ListUrlPatch = Record<string, string | number | undefined | null>;

/**
 * @deprecated 请改用 `defineListSearchParams` + `useListSearch`（约定大于配置：
 * 默认 page/pageSize/keyword + DataTable.dataTableProps）。
 * 本 Hook 仅作存量切片（StoreView/QuoteView/RoleListView 等）迁移过渡，
 * 新代码禁止使用；存量迁完后将从 `@base/ui` 移除。
 */
export function useListUrlNav(options?: {
  readonly defaultPage?: number;
  readonly defaultPageSize?: number;
}) {
  const defaultPage = options?.defaultPage ?? 1;
  const defaultPageSize = options?.defaultPageSize ?? 10;
  const router = useSafeRouter();

  const navigateList = React.useCallback(
    (patch: ListUrlPatch) => {
      if (!router) return;
      const next = new URLSearchParams();
      for (const [key, raw] of Object.entries(patch)) {
        if (raw === undefined || raw === null || raw === "") continue;
        if (key === "page" && Number(raw) === defaultPage) continue;
        if (key === "pageSize" && Number(raw) === defaultPageSize) continue;
        next.set(key, String(raw));
      }
      const qs = next.toString();
      router.push(qs ? `?${qs}` : window.location.pathname);
    },
    [router, defaultPage, defaultPageSize],
  );

  return { navigateList, router };
}
