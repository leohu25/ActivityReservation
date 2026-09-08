/**
 * @chenrun/feature-platform-admin
 * 平台运营商总控中心垂直切片模块 (FDD Feature Module)
 * 包含平台超管身份识别守卫、大盘统计与租户生命周期服务、管理界面组件与契约类型。
 */

export * from "./types";
export * from "./auth/platform-admin-guard";
export * from "./services/index";
export * from "./components/index";
export * from "./server/auth-runtime";
export * from "./server/session";
export * from "./actions";
