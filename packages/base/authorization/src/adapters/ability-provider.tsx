"use client";

import React, { useMemo, type ReactNode } from "react";
import { AbilityProvider, useAbility } from "@casl/react";
import {
  createAbilityFromSnapshot,
  type AbilitySnapshot,
  type AppClientAbility,
} from "./client-ability";

/**
 * 官方 CASL 客户端 Provider（教科书形态）：
 * 只接收 RSC 可序列化快照，在浏览器重建 Ability 实例并注入。
 * 禁止把 Ability 实例从 Server Component 直传进来。
 */
export function TenantAbilityProvider({
  snapshots,
  children,
}: {
  readonly snapshots: AbilitySnapshot | readonly AbilitySnapshot[];
  readonly children: ReactNode;
}) {
  const ability = useMemo(
    () => createAbilityFromSnapshot(snapshots),
    [snapshots],
  );

  return <AbilityProvider value={ability}>{children}</AbilityProvider>;
}

/**
 * 可选读取 CASL Ability：无 Provider 时返回 null（Fail-Closed，禁止整页崩溃）。
 * 生产代码优先使用官方 `useAbility`；本钩子供「可能无 Provider」的通用积木使用。
 */
export function useOptionalAbility(): AppClientAbility | null {
  try {
    const ability = useAbility<AppClientAbility>();
    return ability ?? null;
  } catch {
    return null;
  }
}

/**
 * 与页面 subject 绑定的 can()：无 Provider / 无 subject 时恒 false。
 */
export function useSubjectCan(subject: string) {
  const ability = useOptionalAbility();
  return (action: string, field?: string) => {
    if (!ability || !subject) return false;
    return ability.can(action, subject, field);
  };
}
