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
export { useListUrlNav, type ListUrlPatch } from "./lib/use-list-url-nav";
export {
	useDataTableState,
	type UseDataTableStateOptions,
} from "./lib/use-data-table-state";
export { useIsMobile } from "./hooks/use-mobile";
