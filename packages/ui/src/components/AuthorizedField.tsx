import React, { cloneElement, isValidElement } from "react";

export interface AbilityLike {
  can(action: string, subject: string, field?: string): boolean;
}

export type FieldAccessMode = "HIDDEN" | "READONLY" | "EDITABLE";

export interface AuthorizedFieldProps {
  /** CASL Ability 实例，用于全自动推导 read / write 权限三态 */
  readonly ability?: AbilityLike | null;
  /** 实体名称 (如 'PurchaseOrder', 'Customer') */
  readonly subject: string;
  /** 字段名 (如 'costPrice', 'supplierName') */
  readonly field: string;
  /** 校验写入能力的动作，默认为 "update"，新增表单可指定为 "create" */
  readonly action?: string;
  /** 手动指定的模式覆盖 (优先级高于自动推导) */
  readonly mode?: FieldAccessMode;
  /** 表单控件子元素 (如 <Input />, <Select />) */
  readonly children: React.ReactElement<{
    readOnly?: boolean;
    disabled?: boolean;
    className?: string;
  }>;
  /** 字段中文显示名称/标题 */
  readonly label?: string;
  /** 隐藏或无权访问时的占位渲染内容 (默认不渲染) */
  readonly fallback?: React.ReactNode;
}

/**
 * 推导字段访问三态 (HIDDEN, READONLY, EDITABLE)
 * 遵循《SaaS Foundation 权限系统完整设计方案》第 15、31、39 节规范：
 * - 不能 read -> HIDDEN (隐藏)
 * - 能 read 但不能 write -> READONLY (只读)
 * - 能 read 且能 write -> EDITABLE (可编辑)
 */
export function deriveFieldMode(
  ability: AbilityLike | null | undefined,
  subject: string,
  field: string,
  action: string = "update",
  overrideMode?: FieldAccessMode,
): FieldAccessMode {
  if (overrideMode) {
    return overrideMode;
  }
  if (!ability) {
    // 严格遵循 Fail-Closed 原则：当缺少 Ability 时默认隐藏拒绝，杜绝未授权字段外泄
    return "HIDDEN";
  }

  const readable = ability.can("read", subject, field);
  const writable = ability.can(action, subject, field);

  if (!readable) {
    return "HIDDEN";
  }
  if (!writable) {
    return "READONLY";
  }
  return "EDITABLE";
}

/**
 * 工业级全自动字段权限表单组件 (AuthorizedField)
 * 依据当前 CASL Ability 全自动感应并呈现 HIDDEN (剥离隐藏)、READONLY (只读锁定) 与 EDITABLE (正常交互)。
 */
export function AuthorizedField({
  ability,
  subject,
  field,
  action = "update",
  mode,
  children,
  label,
  fallback = null,
}: AuthorizedFieldProps) {
  const resolvedMode = deriveFieldMode(ability, subject, field, action, mode);

  if (resolvedMode === "HIDDEN") {
    return fallback
      ? React.createElement(React.Fragment, null, fallback)
      : null;
  }

  const isReadOnly = resolvedMode === "READONLY";

  let badgeElement: React.ReactNode = null;
  if (isReadOnly) {
    badgeElement = React.createElement(
      "span",
      {
        className:
          "rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700",
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
        {
          className: "text-xs font-semibold text-slate-700 dark:text-slate-300",
        },
        label,
      ),
      badgeElement,
    );
  }

  let childElement: React.ReactNode = children;
  if (isValidElement(children)) {
    const existingClass = children.props.className || "";
    const readOnlyClass = isReadOnly
      ? "bg-slate-100/70 text-slate-500 cursor-not-allowed dark:bg-slate-800/50 dark:text-slate-400"
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
