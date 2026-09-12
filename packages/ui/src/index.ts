export * from "./lib/utils";
export { useSafeRouter } from "./lib/use-safe-router";
export { useListUrlNav, type ListUrlPatch } from "./lib/use-list-url-nav";
export { useIsMobile } from "./hooks/use-mobile";
// 官方 CASL 客户端范式（AbilityProvider / Can / useAbility）
export {
  TenantAbilityProvider,
  useOptionalAbility,
  useSubjectCan,
  createAbilityFromSnapshot,
  AbilityContext,
  Can,
  useAbility,
  type AbilitySnapshot,
} from "@base/authorization";
// 1 shadcn 层
export * from "./components/shadcn";
// 2 组件层
export * from "./components/feedback";
export * from "./components/composite/data-table";
export * from "./components/composite/auth";
export * from "./components/composite/form";
export * from "./components/layout/TopHeader";
// 业务侧边栏覆盖 shadcn 同名 Sidebar 导出（保留既有 @base/ui API）
export {
  Sidebar,
  type NavItem,
  type NavSection,
  type SidebarProps,
} from "./components/layout/Sidebar";
// 3 模板层
export * from "./components/templates";
export * from "./components/ThemeProvider";
export * from "./components/ThemeToggle";
export * from "./components/DictionarySectionCard";
// 导出 Zod 校验运行时
export { z } from "zod";
