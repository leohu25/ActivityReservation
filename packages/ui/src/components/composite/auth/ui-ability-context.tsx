"use client";

import * as React from "react";
import type { ReactNode } from "react";

/**
 * UI 消费权限能力的最小纯抽象接口（与具体 CASL 完全解耦）
 */
export interface UiAbilityLike {
 can(action: string, subject: any, field?: string): boolean;
}

export const UiAbilityContext = React.createContext<UiAbilityLike | null>(null);

export interface UiAbilityProviderProps {
 readonly ability: UiAbilityLike | null | undefined;
 readonly children: ReactNode;
}

/**
 * 供装配层或上层向 UI 体系注入权限能力的纯 Context Provider
 */
export function UiAbilityProvider({
 ability,
 children,
}: UiAbilityProviderProps) {
 const value = React.useMemo(() => ability ?? null, [ability]);
 return (
  <UiAbilityContext.Provider value={value}>
   {children}
  </UiAbilityContext.Provider>
 );
}

/**
 * UI 内部安全读取权限能力的 Hook（Fail-Closed：无 Provider 时返回 null）
 */
export function useUiAbility(): UiAbilityLike | null {
 return React.useContext(UiAbilityContext);
}
