"use client";

import React, { type ReactNode, useState } from "react";
import { MoreHorizontal, Eye, Edit2, Trash2 } from "lucide-react";
import { useOptionalAbility } from "@base/authorization";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../shadcn/dropdown-menu";
import { Button } from "../../shadcn/button";
import { ConfirmDialog } from "../../feedback/ConfirmDialog";
import { useDataTableContext } from "./DataTableContext";
import { cn } from "../../../lib/utils";

export interface RowActionItem<TRecord> {
  label: string;
  /** 可选自定义图标 */
  icon?: ReactNode;
  action?: string;
  variant?: "default" | "destructive";
  /** 是否折叠进 ... 菜单中 (默认 false，所有操作默认在行内直接平铺展示) */
  collapsed?: boolean;
  /** 平铺展示时的自定义样式 */
  inlineClassName?: string;
  onClick: (record: TRecord) => void | Promise<void>;
  confirm?: {
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
  };
}

export interface DataTableRowActionsProps<TRecord> {
  record: TRecord;
  /** 内置查看操作回调（固定绑定 Eye 图标） */
  onView?: (record: TRecord) => void;
  /** 内置编辑操作回调（固定绑定 Edit2 图标） */
  onEdit?: (record: TRecord) => void;
  /** 内置删除操作回调（固定绑定 Trash2 图标，默认行内平铺） */
  onDelete?: (record: TRecord) => void | Promise<void>;
  /** 删除确认提示文案配置 */
  deleteConfirm?: {
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
  };
  /**
   * 平铺文本链接操作，未提供时默认平铺内置「详情/编辑/删除」。
   */
  inlineActions?: readonly RowActionItem<TRecord>[];
  /** 扩展操作列表（默认全部在行内平铺展示，只有显式指定 collapsed: true 才进入 ... 折叠菜单） */
  extraActions?: readonly RowActionItem<TRecord>[];
  /** 显式隐藏内置操作 */
  hideView?: boolean;
  hideEdit?: boolean;
  hideDelete?: boolean;
  /** 显式指定折叠内置操作到 ... 菜单中（默认均为 false，全在行内平铺展示） */
  collapseView?: boolean;
  collapseEdit?: boolean;
  collapseDelete?: boolean;
  /** 无权限时的展示策略：hidden（默认隐藏）或 disabled-tooltip */
  unauthorizedStrategy?: "hidden" | "disabled-tooltip";
  className?: string;
}

/**
 * 官方标准行操作栏 (DataTableRowActions)
 * - 规则：操作按钮默认全部在行内直接平铺展示，直观高频，除非显式指定 collapsed 折叠；
 * - 图标：内置操作（详情、编辑、删除）恒定展示统一标准图标，扩展操作支持任意传入；
 * - 安全：高危删除操作点击弹出 ConfirmDialog 二次防误删。
 */
export function DataTableRowActions<TRecord>({
  record,
  onView,
  onEdit,
  onDelete,
  deleteConfirm,
  inlineActions,
  extraActions = [],
  collapseView = false,
  collapseEdit = false,
  collapseDelete = false,
  hideView = false,
  hideEdit = false,
  hideDelete = false,
  unauthorizedStrategy = "hidden",
  className,
}: DataTableRowActionsProps<TRecord>) {
  const { subject } = useDataTableContext();
  const ability = useOptionalAbility();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeConfirmAction, setActiveConfirmAction] =
    useState<RowActionItem<TRecord> | null>(null);

  // Fail-Closed：缺 ability 或 subject 一律拒绝
  const canPerform = (actionName: string) => {
    if (!subject || !ability) return false;
    return ability.can(actionName, subject);
  };

  const canView = canPerform("read");
  const canEdit = canPerform("update");
  const canDelete = canPerform("delete");

  const keepUnauthorized = unauthorizedStrategy === "disabled-tooltip";

  // 构建内置操作列表项
  const builtInActions: RowActionItem<TRecord>[] = React.useMemo(() => {
    if (inlineActions) {
      return inlineActions.filter((item) =>
        item.action ? canPerform(item.action) || keepUnauthorized : true,
      );
    }
    const list: RowActionItem<TRecord>[] = [];
    if (!hideView && (canView || keepUnauthorized)) {
      list.push({
        label: "详情",
        action: "read",
        icon: <Eye className="size-3.5" />,
        collapsed: collapseView,
        onClick: () => onView?.(record),
      });
    }
    if (!hideEdit && (canEdit || keepUnauthorized)) {
      list.push({
        label: "编辑",
        action: "update",
        icon: <Edit2 className="size-3.5" />,
        collapsed: collapseEdit,
        onClick: () => onEdit?.(record),
      });
    }
    return list;
  }, [
    inlineActions,
    hideView,
    hideEdit,
    collapseView,
    collapseEdit,
    canView,
    canEdit,
    onView,
    onEdit,
    record,
    subject,
    ability,
    keepUnauthorized,
  ]);

  // 合并所有合法的扩展操作
  const validExtraActions = React.useMemo(() => {
    return extraActions.filter((item) =>
      item.action ? canPerform(item.action) || keepUnauthorized : true,
    );
  }, [extraActions, keepUnauthorized, ability, subject]);

  // 区分平铺操作与折叠操作（默认全部平铺，只有 collapsed: true 才进入折叠菜单）
  const allActions = React.useMemo(() => {
    return [...validExtraActions, ...builtInActions];
  }, [validExtraActions, builtInActions]);

  const inlineItems = React.useMemo(() => {
    return allActions.filter((act) => !act.collapsed);
  }, [allActions]);

  const menuItems = React.useMemo(() => {
    return allActions.filter((act) => act.collapsed);
  }, [allActions]);

  const showDelete = !hideDelete && (canDelete || keepUnauthorized);
  const deleteDisabled = !onDelete;
  const isDeleteInline = !collapseDelete;

  // 有权限但未配置回调 → 置灰
  const isActionDisabled = (item: RowActionItem<TRecord>) => {
    if (item.action === "read") return !onView;
    if (item.action === "update") return !onEdit;
    return false;
  };

  const showDropdown = menuItems.length > 0 || (showDelete && !isDeleteInline);
  const hasAnyAction =
    inlineItems.length > 0 || (showDelete && isDeleteInline) || showDropdown;

  if (!hasAnyAction) {
    return null;
  }

  const runAction = (item: RowActionItem<TRecord>) => {
    if (item.confirm) {
      setActiveConfirmAction(item);
    } else {
      void item.onClick(record);
    }
  };

  return (
    <div className={cn("flex items-center justify-end gap-2", className)}>
      {/* 1. 默认平铺在行内的所有操作（包括内置与扩展，带图标） */}
      {inlineItems.map((item) => {
        const disabled = isActionDisabled(item);
        return (
          <Button
            key={item.label}
            type="button"
            variant="link"
            size="sm"
            disabled={disabled}
            title={disabled ? "未配置操作回调" : undefined}
            className={cn(
              "h-auto p-0 px-1 text-xs font-medium no-underline hover:underline inline-flex items-center gap-1",
              disabled && "opacity-50 hover:no-underline cursor-not-allowed",
              item.variant === "destructive"
                ? "text-destructive hover:text-destructive"
                : "text-primary hover:text-primary",
              item.inlineClassName,
            )}
            onClick={() => {
              if (!disabled) runAction(item);
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </Button>
        );
      })}

      {/* 2. 平铺删除操作（默认平铺，带 Trash2 图标，高频动作直接呈现） */}
      {showDelete && isDeleteInline && (
        <Button
          type="button"
          variant="link"
          size="sm"
          disabled={deleteDisabled}
          className={cn(
            "h-auto p-0 px-1 text-xs font-medium no-underline hover:underline text-destructive hover:text-destructive inline-flex items-center gap-1",
            deleteDisabled &&
              "opacity-50 hover:no-underline cursor-not-allowed",
          )}
          onClick={() => setDeleteConfirmOpen(true)}
        >
          <Trash2 className="size-3.5" />
          <span>删除</span>
        </Button>
      )}

      {/* 3. 只有显式指定 collapsed: true 的操作才进入 ... 折叠菜单 */}
      {showDropdown && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="size-7 p-0 text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="size-3.5" />
              <span className="sr-only">打开操作菜单</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[140px] text-xs">
            <DropdownMenuGroup>
              {menuItems.map((item) => {
                const disabled = isActionDisabled(item);
                return (
                  <DropdownMenuItem
                    key={item.label}
                    disabled={disabled}
                    onClick={() => {
                      if (!disabled) runAction(item);
                    }}
                    className={cn(
                      "gap-2 cursor-pointer",
                      item.variant === "destructive" && "text-destructive",
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </DropdownMenuItem>
                );
              })}

              {showDelete && !isDeleteInline && (
                <DropdownMenuItem
                  disabled={deleteDisabled}
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="size-3.5" />
                  <span>删除记录</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* 内置二次确认防误删弹窗 */}
      {showDelete && !deleteDisabled && (
        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title={deleteConfirm?.title || "确认删除此记录？"}
          description={
            deleteConfirm?.description ||
            "此操作无法撤销，数据删除后将无法恢复，请谨慎操作。"
          }
          confirmText={deleteConfirm?.confirmText || "确认删除"}
          cancelText={deleteConfirm?.cancelText || "取消"}
          variant="destructive"
          onConfirm={async () => {
            await onDelete?.(record);
          }}
        />
      )}

      {/* 扩展操作自定义二次确认弹窗 */}
      {activeConfirmAction && (
        <ConfirmDialog
          open={Boolean(activeConfirmAction)}
          onOpenChange={(open) => {
            if (!open) setActiveConfirmAction(null);
          }}
          title={activeConfirmAction.confirm?.title || "请确认操作"}
          description={activeConfirmAction.confirm?.description}
          confirmText={activeConfirmAction.confirm?.confirmText || "确定"}
          cancelText={activeConfirmAction.confirm?.cancelText || "取消"}
          variant={activeConfirmAction.variant || "default"}
          onConfirm={async () => {
            await activeConfirmAction.onClick(record);
          }}
        />
      )}
    </div>
  );
}
