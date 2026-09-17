"use client";

import React, { useState, useContext, type ReactNode } from "react";
import { Button } from "../../shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../shadcn/tooltip";
import { ConfirmDialog } from "../../feedback/ConfirmDialog";
import { useUiAbility } from "./ui-ability-context";
import { DataTableContext } from "../table/DataTableContext";
import { cn } from "../../../lib/utils";

export interface ActionConfirmConfig {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export interface ActionButtonProps extends Omit<
  React.ComponentProps<typeof Button>,
  "onClick"
> {
  /** 权限动作名称 (如 "create", "update", "delete", "export", "audit") */
  action?: string;
  /** 权限 Subject 覆盖，若未传入则自动从上下文继承 */
  subject?: string;
  /** 字段名校验 (如需判断对特定字段的修改权限) */
  field?: string;
  /**
   * 无权限时的展示策略：
   * - `hidden`（默认）：对普通用户按权限隐藏，在 DOM 中物理不渲染
   * - `disabled-tooltip`：置灰并提示（调试或希望始终可见时使用）
   */
  unauthorizedStrategy?: "hidden" | "disabled-tooltip";
  /** 无权限时 Tooltip 提示文案，默认 "暂无操作权限" */
  unauthorizedTooltip?: string;
  /** 二次确认配置（高危操作自动触发内置 ConfirmDialog） */
  confirm?: ActionConfirmConfig;
  /** 点击回调（支持同步或异步） */
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  children?: ReactNode;
}

/**
 * 分子级受控动作按钮 (ActionButton)
 * - 组合原子组件 Button 与 Tooltip / ConfirmDialog
 * - 纯依赖 UiAbilityLike 抽象权限上下文 (useUiAbility)，与具体 CASL 完全解耦
 * - 自动优先继承外层 DataTableContext / 自定义上下文的 subject，亦支持显式传入
 * - 内置二次确认防误删机制，业务无需维护冗余的 useState(open)
 */
export function ActionButton({
  action,
  subject: explicitSubject,
  field,
  unauthorizedStrategy = "hidden",
  unauthorizedTooltip = "暂无操作权限",
  confirm,
  onClick,
  children,
  disabled,
  className,
  ...props
}: ActionButtonProps) {
  const tableContext = useContext(DataTableContext);
  const ability = useUiAbility();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const targetSubject = explicitSubject || tableContext?.subject;

  // Fail-Closed：声明了 action 却缺 subject 或 ability 时一律拒绝
  const hasPermission = React.useMemo(() => {
    if (!action) return true;
    if (!targetSubject || !ability) return false;
    return ability.can(action, targetSubject, field);
  }, [action, ability, targetSubject, field]);

  if (!hasPermission) {
    if (unauthorizedStrategy === "hidden") {
      return null;
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={<span className="inline-block cursor-not-allowed" />}
          >
            <Button
              disabled
              className={cn("pointer-events-none opacity-50", className)}
              {...props}
            >
              {children}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{unauthorizedTooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (confirm) {
      setConfirmOpen(true);
      return;
    }
    if (onClick) {
      const res = onClick(e);
      if (res && typeof res.then === "function") {
        setLoading(true);
        res.finally(() => setLoading(false));
      }
    }
  };

  const handleConfirm = async () => {
    if (onClick) {
      setLoading(true);
      try {
        await onClick();
      } finally {
        setLoading(false);
        setConfirmOpen(false);
      }
    } else {
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <Button
        disabled={disabled || loading}
        className={className}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Button>

      {confirm && (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={confirm.title}
          description={confirm.description}
          confirmText={confirm.confirmText || "确定"}
          cancelText={confirm.cancelText || "取消"}
          variant={
            confirm.variant ||
            (props.variant === "destructive" ? "destructive" : "default")
          }
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}
