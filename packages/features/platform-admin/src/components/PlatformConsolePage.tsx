import React from "react";
import { getPlatformAdminService } from "../server/auth-runtime";
import { requirePlatformAdminSession } from "../server/session";
import { PlatformConsoleClient } from "./PlatformConsoleClient";

export interface PlatformConsolePageProps {
 /** 自定义控制台标题（可选） */
 readonly title?: string;
}

/**
 * 平台运营商总控面板核心页面组件 (Server Component - 自包含 FDD 切片入口)
 * 内部自包含鉴权校验 -> 调取 Service -> 渲染客户端交互视图
 */
export async function PlatformConsolePage(
 _props?: PlatformConsolePageProps,
): Promise<React.JSX.Element> {
 // 1. 验证平台超管会话，非超管直接重定向或拒绝
 await requirePlatformAdminSession();

 // 2. 直调 Feature 服务层
 const service = getPlatformAdminService();
 const [stats, tenants] = await Promise.all([
  service.getStats(),
  service.listTenants(),
 ]);

 // 3. 渲染自包含的客户端交互视图
 return <PlatformConsoleClient stats={stats} tenants={tenants} />;
}
