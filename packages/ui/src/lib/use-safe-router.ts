"use client";

import { useRouter } from "next/navigation";

/**
 * RSC / 测试环境安全的 Next.js router
 * 非 App Router 上下文时返回 null，避免整页崩溃。
 */
export function useSafeRouter() {
  try {
    return useRouter();
  } catch {
    return null;
  }
}
