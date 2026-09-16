export * from "./lib/utils";
export { useSafeRouter } from "./lib/use-safe-router";
export { useListUrlNav, type ListUrlPatch } from "./lib/use-list-url-nav";
export {
  useDataTableState,
  type UseDataTableStateOptions,
} from "./lib/use-data-table-state";
export { useIsMobile } from "./hooks/use-mobile";
// 纯 UI 抽象权限上下文（与具体鉴权框架解耦）
export {
  UiAbilityProvider,
  useUiAbility,
  type UiAbilityLike,
  type UiAbilityProviderProps,
} from "./components/composite/auth";
/** @deprecated 请使用 useUiAbility 替代，以保持 UI 库与鉴权引擎解耦 */
export { useUiAbility as useOptionalAbility } from "./components/composite/auth";
// 1. 原子层 (Atoms / shadcn 官方原语)
export * from "./components/shadcn";
// 2. 分子层 (Molecules / Composite 受控中立组件)
export * from "./components/feedback";
export * from "./components/composite/table";
export * from "./components/composite/tree";
export * from "./components/composite/auth";
export * from "./components/composite/form";
export * from "./components/composite/icon";
export * from "./components/layout/TopHeader";
// 业务侧边栏覆盖 shadcn 同名 Sidebar 导出（保留既有 @base/ui API）
export {
  Sidebar,
  type NavItem,
  type NavSection,
  type SidebarProps,
} from "./components/layout/Sidebar";
// 3. 模板层 (Templates / 完整业务容器)
export * from "./components/templates";
export * from "./components/ThemeProvider";
export * from "./components/ThemeToggle";
export * from "./components/DictionarySectionCard";
// 导出 Zod 校验运行时
export { z } from "zod";
