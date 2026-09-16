"use client";

import * as React from "react";
import { useSafeRouter } from "./use-safe-router";

export type ListUrlPatch = Record<string, string | number | undefined | null>;

/**
 * 列表页 URL 查询参数导航（服务端筛选/翻页共用）
 * 仅 push 非空参数；默认分页 1 / pageSize 10 不写入 URL。
 * 使用 useSafeRouter：非 App Router 上下文（单测 renderToString）安全降级。
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
