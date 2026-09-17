import * as React from "react";

// SAFETY: 在 Node.js/tsx 测试环境下垫片 globalThis.React，避免未显式导入 React 的模块发生 ReferenceError
const globalScope = globalThis as unknown as { React?: typeof React };
if (!globalScope.React) {
  // SAFETY: 仅在缺失时绑定全局 React 实例以兼容测试运行时
  globalScope.React = React;
}

export * from "./components/shadcn";
export * from "./components/feedback";
export * from "./components/composite/badge";
export { Badge, type BadgeProps } from "./components/composite/badge";
export * from "./components/composite/table";
export * from "./components/composite/tree";
export * from "./components/composite/auth";
export * from "./components/composite/form";
export { Select, type SelectProps } from "./components/composite/form";
export {
  Combobox,
  type ComboboxOption,
  type ComboboxProps,
} from "./components/composite/form";
export * from "./components/composite/icon";
export * from "./components/layout/TopHeader";
export * from "./components/layout/TabBar";
export * from "./components/layout/BreadcrumbBar";
export {
  Sidebar,
  type NavItem,
  type NavSection,
  type SidebarProps,
} from "./components/layout/Sidebar";
export * from "./components/templates";
export * from "./components/ThemeProvider";
export * from "./components/ThemeToggle";
export * from "./components/DictionarySectionCard";
export { z } from "zod";
export * from "./lib/utils";
export { useSafeRouter } from "./lib/use-safe-router";
export { useListUrlNav, type ListUrlPatch } from "./lib/use-list-url-nav";
export {
  useDataTableState,
  type UseDataTableStateOptions,
} from "./lib/use-data-table-state";
export { useIsMobile } from "./hooks/use-mobile";
export {
  UiAbilityProvider,
  useUiAbility,
  type UiAbilityLike,
  type UiAbilityProviderProps,
} from "./components/composite/auth";
