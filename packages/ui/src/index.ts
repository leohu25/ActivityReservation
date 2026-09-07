/**
 * @chenrun/ui
 * 共享基础 UI 组件与门禁展示
 */

import React from "react";

export interface CanProps {
 permission: string;
 children: React.ReactNode;
 fallback?: React.ReactNode;
}

/**
 * 权限门禁组件契约（实际判定由 foundation 上下文提供）
 */
export function Can({ children }: CanProps) {
 return React.createElement(React.Fragment, null, children);
}
