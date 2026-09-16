/**
 * 第 3 层：模板层 (Templates / Page-level Compositions)
 *
 * 由多个组件层零件拼成的完整页面骨架：
 * - 默认全量控件（约定大于配置）
 * - 支持 show* / hide* 显式关闭
 * - 支持扩展插槽（toolbarExtra / extraActions / children）
 */
export * from "./FormModal";
export * from "./DataTable";
export * from "./DashboardShell";
export * from "./PageShell";
export * from "./MasterDetailShell";
export * from "./DataTree";
