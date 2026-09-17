"use client";

import React from "react";
import { LayoutDashboard, Folder, ExternalLink, FileText } from "lucide-react";
import { ICON_MAP } from "./icon-catalog";

export interface DynamicNavIconProps {
 readonly name?: string | null;
 readonly className?: string;
 readonly fallbackType?: "group" | "page" | "external";
}

/**
 * 统一企业级动态导航图标渲染组件
 * 根据图标名称字符串动态解析并安全渲染，具备智能三态出厂回退：
 * - 目录分组默认回退 Folder
 * - 外链节点默认回退 ExternalLink
 * - 普通页面默认回退 FileText
 */
export function DynamicNavIcon({
 name,
 className = "size-4",
 fallbackType = "page",
}: DynamicNavIconProps) {
 if (name && ICON_MAP[name]) {
  const IconComponent = ICON_MAP[name];
  return <IconComponent className={className} />;
 }

 // 优雅出厂智能回退
 if (fallbackType === "group") {
  return <Folder className={className} />;
 }
 if (fallbackType === "external") {
  return <ExternalLink className={className} />;
 }
 if (fallbackType === "page") {
  return <FileText className={className} />;
 }

 return <LayoutDashboard className={className} />;
}
