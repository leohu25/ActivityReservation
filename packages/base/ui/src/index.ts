import * as React from "react";

// SAFETY: 在 Node.js/tsx 测试环境下垫片 globalThis.React，避免未显式导入 React 的模块发生 ReferenceError
const globalScope = globalThis as unknown as { React?: typeof React };
if (!globalScope.React) {
	// SAFETY: 仅在缺失时绑定全局 React 实例以兼容测试运行时
	globalScope.React = React;
}

// 1. Primitives (官方原子基石组件，包含原生 Badge/Select 扩展)
export * from "./components/ui";

// 2. High-Level Components (语义化高阶中台组件)
export * from "./components/data-table";
export * from "./components/auth";
export * from "./components/form";
export * from "./components/upload/ImageUpload";
export {
	Combobox,
	type ComboboxOption,
	type ComboboxProps,
} from "./components/form";
export * from "./components/tree";
export * from "./components/feedback";
export * from "./components/icon";
export * from "./components/layout";
export {
	Sidebar,
	type NavItem,
	type NavSection,
	type SidebarProps,
} from "./components/layout";

// 3. Theme & Specialized Components
export * from "./components/ThemeProvider";
export * from "./components/ThemeToggle";
export * from "./components/DictionarySectionCard";

// 4. Utilities & Hooks
export { z } from "zod";
export * from "./lib/utils";
export { useSafeRouter } from "./lib/use-safe-router";
/** 列表 URL 契约（推荐）：server-safe，可被 RSC contract 引用 */
export {
	defineListSearchParams,
	listSearchParamsDefaults,
	type DefinedListSearchParams,
	type ListSearchParamsValues,
} from "./lib/list-search-params";
export {
	useListSearch,
	type UseListSearchResult,
} from "./lib/use-list-search";
/** 主流别名：与 React 生态 List/Params 用语对齐 */
export {
	defineListSearchParams as defineListParams,
	type DefinedListSearchParams as DefinedListParams,
	type ListSearchParamsValues as ListParamsValues,
} from "./lib/list-search-params";
export {
	useListSearch as useListParams,
	type UseListSearchResult as UseListParamsResult,
} from "./lib/use-list-search";
export { useIsMobile } from "./hooks/use-mobile";
