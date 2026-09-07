/**
 * @chenrun/ui
 * 共享基础 UI 组件与 CASL 门禁展示
 */

import React from "react";

export interface CanProps {
  I: string;
  a: string;
  field?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * CASL 权限门禁组件 (兼容 @casl/react 风格)
 */
export function Can({ children }: CanProps) {
  return React.createElement(React.Fragment, null, children);
}

export interface PermissionProps {
  action: string;
  subject: string;
  field?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * 项目语义化门禁包装组件
 */
export function Permission({ children }: PermissionProps) {
  return React.createElement(React.Fragment, null, children);
}

export interface PermissionFieldProps {
  mode: "HIDDEN" | "READONLY" | "EDITABLE";
  children: React.ReactElement<{ readOnly?: boolean; disabled?: boolean }>;
}

/**
 * 字段三态门禁包装组件
 */
export function PermissionField({ mode, children }: PermissionFieldProps) {
  if (mode === "HIDDEN") {
    return null;
  }
  return React.cloneElement(children, {
    readOnly: mode === "READONLY",
    disabled: mode === "READONLY",
  });
}
