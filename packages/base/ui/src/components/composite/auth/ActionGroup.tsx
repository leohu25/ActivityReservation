"use client";

import React, { type ReactNode } from "react";
import { ActionButton, type ActionConfirmConfig } from "./ActionButton";
import { useUiAbility } from "./ui-ability-context";
import { cn } from "../../../lib/utils";

export interface ActionItem<TRecord = unknown> {
  key?: string;
  action: string;
  label: ReactNode | ((record?: TRecord) => ReactNode);
  icon?: ReactNode;
  variant?:
    "default" | "outline" | "ghost" | "destructive" | "secondary" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean | ((record?: TRecord) => boolean);
  onClick: (record?: TRecord) => void | Promise<void>;
  confirm?: ActionConfirmConfig | ((record?: TRecord) => ActionConfirmConfig);
  className?: string;
}

export interface ActionGroupProps<TRecord = unknown> {
  subject: string;
  actions: readonly ActionItem<TRecord>[];
  record?: TRecord;
  className?: string;
}

/**
 * 分子级受控动作组 (ActionGroup)
 * - 批量编排多个 ActionButton
 * - 依据抽象权限上下文自动过滤无权项
 * - 适用于表格操作列、详情页顶部动作条、卡片操作栏等
 */
export function ActionGroup<TRecord = unknown>({
  subject,
  actions,
  record,
  className,
}: ActionGroupProps<TRecord>) {
  const ability = useUiAbility();

  const visibleActions = React.useMemo(() => {
    return actions.filter((act) => {
      if (!ability || !subject) return false;
      return ability.can(act.action, subject);
    });
  }, [actions, ability, subject]);

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      {visibleActions.map((act, index) => {
        const key = act.key || act.action || String(index);
        const resolvedLabel: ReactNode =
          typeof act.label === "function"
            ? (act.label as (r?: TRecord) => ReactNode)(record)
            : act.label;
        const resolvedDisabled: boolean | undefined =
          typeof act.disabled === "function"
            ? (act.disabled as (r?: TRecord) => boolean)(record)
            : act.disabled;
        const resolvedConfirm: ActionConfirmConfig | undefined =
          typeof act.confirm === "function"
            ? (act.confirm as (r?: TRecord) => ActionConfirmConfig)(record)
            : act.confirm;

        return (
          <ActionButton
            key={key}
            action={act.action}
            subject={subject}
            variant={act.variant || "ghost"}
            size={act.size || "sm"}
            disabled={resolvedDisabled}
            confirm={resolvedConfirm}
            onClick={() => act.onClick(record)}
            className={act.className}
          >
            {act.icon && <span className="mr-1 inline-flex">{act.icon}</span>}
            {resolvedLabel}
          </ActionButton>
        );
      })}
    </div>
  );
}
