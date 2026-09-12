"use client";

import React, { type ReactNode } from "react";
import { useOptionalAbility } from "@base/authorization";
import { Button } from "../../shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../shadcn/tooltip";
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
  /**
   * 无权限时的展示策略：
   * - `hidden`（默认）：对普通用户按权限隐藏
   * - `disabled-tooltip`：置灰并提示（调试或希望始终可见时使用）
   */
  unauthorizedStrategy?: "hidden" | "disabled-tooltip";
  /** 无权限时 Tooltip 提示文案，默认 "暂无操作权限" */
  unauthorizedTooltip?: string;
}

/**
 * 列表动作按钮积木 (DataTableActionButton)
 * 深度集成 CASL 权限自动判定：
 * 自动从 DataTableContext 感知 subject 和 ability，无需在每个按钮上重复传参！
 *
 * 约定：页面直接声明按钮；是否展示由权限决定。不需要的按钮在页面上不写或显式关闭，
 * 对应 action 也可从角色权限目录中移除。
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
  const { subject: contextSubject } = useDataTableContext();
  const ability = useOptionalAbility();

  const targetSubject = explicitSubject || contextSubject;

  // Fail-Closed：声明了 action 却缺 subject/ability 时拒绝；未声明 action 视为非受控按钮
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
  const { subject, isAnySelected, selectedKeys } = useDataTableContext();
  const ability = useOptionalAbility();

  const can = (action: string, field?: string) => {
    // Fail-Closed：缺 ability/subject 一律拒绝，禁止无上下文放行
    if (!ability || !subject) return false;
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
