export * from "./lib/utils";
export * from "./components/button";
export * from "./components/card";
export * from "./components/table";
export * from "./components/input";
export * from "./components/badge";
export * from "./components/MetricCard";
export * from "./components/ProcessStepper";
export * from "./components/ExceptionList";
export * from "./components/layout/DashboardShell";
export * from "./components/layout/TopHeader";
export * from "./components/layout/Sidebar";
export * from "./components/AuthorizedField";
export * from "./components/BusinessTableWorkspace";
export * from "./components/ThemeProvider";
export * from "./components/ThemeToggle";

import React from "react";
import {
  AuthorizedField,
  type FieldAccessMode,
} from "./components/AuthorizedField";

export interface PermissionFieldProps {
  readonly mode: FieldAccessMode;
  readonly children: React.ReactElement<{
    readOnly?: boolean;
    disabled?: boolean;
    className?: string;
  }>;
  readonly label?: string;
  readonly fallback?: React.ReactNode;
}

/**
 * 字段三态门禁控制组件 (向前兼容层，建议优先使用支持 CASL 自动感应的 AuthorizedField)
 * - HIDDEN: 隐藏
 * - READONLY: 设为只读并禁用
 * - EDITABLE: 正常交互编辑
 */
export function PermissionField({
  mode,
  children,
  label,
  fallback = null,
}: PermissionFieldProps) {
  return React.createElement(AuthorizedField, {
    mode,
    subject: "_compat",
    field: "_compat",
    label,
    fallback,
    children,
  });
}
