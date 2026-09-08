export * from "./lib/utils";
export * from "./components/button";
export * from "./components/card";
export * from "./components/input";
export * from "./components/badge";

import React, { cloneElement, isValidElement } from "react";

export interface PermissionFieldProps {
  readonly mode: "HIDDEN" | "READONLY" | "EDITABLE";
  readonly children: React.ReactElement<{
    readOnly?: boolean;
    disabled?: boolean;
    className?: string;
  }>;
  readonly label?: string;
  readonly fallback?: React.ReactNode;
}

/**
 * 字段三态门禁控制组件 (与 shadcn/ui 样式无缝结合)
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
  if (mode === "HIDDEN") {
    return fallback ? React.createElement(React.Fragment, null, fallback) : null;
  }

  const isReadOnly = mode === "READONLY";

  let badgeElement: React.ReactNode = null;
  if (isReadOnly) {
    badgeElement = React.createElement(
      "span",
      {
        className:
          "rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700",
      },
      "只读",
    );
  }

  let labelElement: React.ReactNode = null;
  if (label) {
    labelElement = React.createElement(
      "div",
      { className: "flex items-center justify-between mb-1" },
      React.createElement(
        "label",
        { className: "text-xs font-semibold text-zinc-700 dark:text-zinc-300" },
        label,
      ),
      badgeElement,
    );
  }

  let childElement: React.ReactNode = children;
  if (isValidElement(children)) {
    const existingClass = children.props.className || "";
    const readOnlyClass = isReadOnly
      ? "bg-zinc-100/70 text-zinc-500 cursor-not-allowed dark:bg-zinc-800/50 dark:text-zinc-400"
      : "";
    childElement = cloneElement(children, {
      disabled: isReadOnly || children.props.disabled,
      readOnly: isReadOnly || children.props.readOnly,
      className: `${existingClass} ${readOnlyClass}`.trim(),
    });
  }

  return React.createElement(
    "div",
    { className: "flex flex-col gap-1.5" },
    labelElement,
    childElement,
  );
}
