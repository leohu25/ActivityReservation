/**
 * 资源化 CRUD 约定层（放在 `@base/biz-shared`，不单开包）。
 * - createResourceActions：服务端 Ability/Zod/CASL/revalidate 管道
 * - createResourceList / createResourcePage：列表页装配
 * 组合 @base/ui（DataTable/FormModal/list params），业务 service 仍在切片。
 */
export * from "./types";
export { createResourceActions, createCrudActions } from "./actions";
export { createResourceList, createCrudView } from "./view";
export { createResourcePage, createCrudPage } from "./page";
