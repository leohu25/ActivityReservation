"use client";

import React, { type ReactNode } from "react";
import { Button } from "../../primitives/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../primitives/tooltip";
import { useDataTableContext } from "./DataTableContext";
import { cn } from "../../../lib/utils";

export interface DataTableActionButtonProps
  extends React.ComponentProps<typeof Button> {
  /** 权限动作名称 (如 "create", "export", "delete", "audit") */
  action?: string;
  /** 权限 Subject 覆盖，若未传入则默认使用 DataTable.Root 上配置的 subject */
  subject?: string;
  /** 字段名校验 (如需判断对特定字段的修改权限) */
  field?: string;
  /** 无权限时的展示策略：'hidden' 直接隐藏，'disabled-tooltip' 置灰并展示 Tooltip 提示 */
  unauthorizedStrategy?: "hidden" | "disabled-tooltip";
  /** 无权限时 Tooltip 提示文案，默认 "暂无操作权限" */
  unauthorizedTooltip?: string;
}

/**
 * 列表动作按钮积木 (DataTableActionButton)
 * 深度集成 CASL 权限自动判定：
 * 自动从 DataTableContext 感知 subject 和 ability，无需在每个按钮上重复传参！
 */
export function DataTableActionButton({
  action,
  subject: explicitSubject,
  field,
  unauthorizedStrategy = "hidden",
  unauthorizedTooltip = "暂无操作权限",
  children,
  disabled,
  className,
  ...props
}: DataTableActionButtonProps) {
  const { subject: contextSubject, ability } = useDataTableContext();

  const targetSubject = explicitSubject || contextSubject;

  // 判定是否有权限执行该 action (严格遵循 Fail-Closed 原则)
  const hasPermission = React.useMemo(() => {
    if (!action) return true;
    if (!targetSubject) return true;
    if (!ability) return false;
    return ability.can(action, targetSubject, field);
  }, [action, ability, targetSubject, field]);

  if (!hasPermission) {
    if (unauthorizedStrategy === "hidden") {
      return null;
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block cursor-not-allowed">
              <Button
                disabled
                className={cn("pointer-events-none opacity-50", className)}
                {...props}
              >
                {children}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent className="text-xs">
            {unauthorizedTooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button disabled={disabled} className={className} {...props}>
      {children}
    </Button>
  );
}

export interface DataTableActionsProps {
  /** 顶部操作按钮组插槽（支持直接传 JSX 或函数接收当前表格上下文） */
  children?:
    | ReactNode
    | ((context: {
        can: (action: string, field?: string) => boolean;
        isAnySelected: boolean;
        selectedKeys: string[];
      }) => ReactNode);
  className?: string;
}

/**
 * 列表顶部操作区插槽容器 (DataTableActions)
 * 支持用户放置各类自定义新建、导入、导出、批量流转等按钮，并提供 can(action) 权限便捷函数
 */
export function DataTableActions({
  children,
  className,
}: DataTableActionsProps) {
  const { ability, subject, isAnySelected, selectedKeys } =
    useDataTableContext();

  const can = (action: string, field?: string) => {
    if (!ability || !subject) return true;
    return ability.can(action, subject, field);
  };

  const selectedArray = React.useMemo(
    () => Array.from(selectedKeys),
    [selectedKeys],
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {typeof children === "function"
        ? children({ can, isAnySelected, selectedKeys: selectedArray })
        : children}
    </div>
  );
}
