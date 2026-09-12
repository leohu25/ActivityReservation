"use client";

import React, { type ReactNode, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { useOptionalAbility } from "@base/authorization";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../shadcn/dropdown-menu";
import { Button } from "../../shadcn/button";
import { ConfirmDialog } from "../../feedback/ConfirmDialog";
import { useDataTableContext } from "./DataTableContext";
import { cn } from "../../../lib/utils";

export interface RowActionItem<TRecord> {
  label: string;
  icon?: ReactNode;
  action?: string;
  variant?: "default" | "destructive";
  /** 平铺展示时的样式 */
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
  /** 内置查看操作回调 */
  onView?: (record: TRecord) => void;
  /** 内置编辑操作回调 */
  onEdit?: (record: TRecord) => void;
  /** 内置删除操作回调（默认带二次确认防误删） */
  onDelete?: (record: TRecord) => void | Promise<void>;
  /** 删除确认提示文案配置 */
  deleteConfirm?: {
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
  };
  /**
   * 平铺文本链接操作（如「详情」「编辑」），直接展示在行内，缩短操作链路。
   * 未提供时默认平铺内置「详情/编辑」。
   */
  inlineActions?: readonly RowActionItem<TRecord>[];
  /** 次要/危险操作，折叠进 `...` 下拉菜单 */
  extraActions?: readonly RowActionItem<TRecord>[];
  /** 是否强制使用纯下拉菜单模式（忽略默认平铺详情/编辑） */
  menuOnly?: boolean;
  /**
   * 页面级约定大于配置：默认展示内置「详情/编辑/删除」。
   * 页面不需要某操作时显式隐藏；对应 action 也可同步从角色权限目录移除。
   */
  hideView?: boolean;
  hideEdit?: boolean;
  hideDelete?: boolean;
  /**
   * 无权限时的展示策略：
   * - `hidden`（默认）：对普通用户按权限隐藏
   * - `disabled-tooltip`：置灰可见
   */
  unauthorizedStrategy?: "hidden" | "disabled-tooltip";
  className?: string;
}

export function DataTableRowActions<TRecord>({
  record,
  onView,
  onEdit,
  onDelete,
  deleteConfirm,
  inlineActions,
  extraActions = [],
  menuOnly = false,
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

  // Fail-Closed：缺 ability 或 subject 一律拒绝（禁止无上下文放行）
  const canPerform = (actionName: string) => {
    if (!subject || !ability) return false;
    return ability.can(actionName, subject);
  };

  const canView = canPerform("read");
  const canEdit = canPerform("update");
  const canDelete = canPerform("delete");

  const keepUnauthorized = unauthorizedStrategy === "disabled-tooltip";

  // 构建平铺操作列表：默认详情/编辑；页面可 hideView/hideEdit 关闭
  const resolvedInline: RowActionItem<TRecord>[] = React.useMemo(() => {
    if (inlineActions) {
      return inlineActions.filter((item) =>
        item.action ? canPerform(item.action) || keepUnauthorized : true,
      );
    }
    if (menuOnly) return [];
    const defaults: RowActionItem<TRecord>[] = [];
    if (!hideView) {
      defaults.push({
        label: "详情",
        action: "read",
        onClick: () => onView?.(record),
      });
    }
    if (!hideEdit) {
      defaults.push({
        label: "编辑",
        action: "update",
        onClick: () => onEdit?.(record),
      });
    }
    return defaults;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    inlineActions,
    menuOnly,
    hideView,
    hideEdit,
    canView,
    canEdit,
    onView,
    onEdit,
    record,
    subject,
    ability,
    keepUnauthorized,
  ]);

  // 有权限但未配置回调 → 置灰（便于开发时识别按钮已预留）
  const isInlineDisabled = (item: RowActionItem<TRecord>) => {
    if (item.action === "read") return !onView;
    if (item.action === "update") return !onEdit;
    return false;
  };

  const filteredInline = resolvedInline.filter((item) => {
    if (!item.action) return true;
    if (canPerform(item.action)) return true;
    return keepUnauthorized;
  });

  const validExtraActions = extraActions.filter((item) =>
    item.action ? canPerform(item.action) || keepUnauthorized : true,
  );

  const showDelete = !hideDelete && (canDelete || keepUnauthorized);
  const deleteDisabled = !onDelete;

  const menuHasBuiltIn =
    menuOnly &&
    ((!hideView && (canView || keepUnauthorized)) ||
      (!hideEdit && (canEdit || keepUnauthorized)));

  const hasAnyAction =
    filteredInline.length > 0 ||
    showDelete ||
    validExtraActions.length > 0 ||
    menuHasBuiltIn;

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
    <div className={cn("flex items-center justify-end gap-0.5", className)}>
      {/* 平铺文本链接操作（默认展示；无权限隐藏；有权限无回调置灰） */}
      {filteredInline.map((item) => {
        const disabled = isInlineDisabled(item);
        return (
          <Button
            key={item.label}
            type="button"
            variant="link"
            size="sm"
            disabled={disabled}
            title={disabled ? "未配置操作回调" : undefined}
            className={cn(
              "h-auto p-0 px-1 text-xs font-medium no-underline hover:underline",
              disabled && "opacity-50 hover:no-underline cursor-not-allowed",
              item.variant === "destructive"
                ? "text-destructive"
                : "text-primary",
              item.inlineClassName,
            )}
            onClick={() => {
              if (!disabled) runAction(item);
            }}
          >
            {item.label}
          </Button>
        );
      })}

      {/* 次要/危险操作折叠菜单 */}
      {(validExtraActions.length > 0 || showDelete || menuHasBuiltIn) && (
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
              {menuOnly && !hideView && (canView || keepUnauthorized) && (
                <DropdownMenuItem
                  disabled={!onView}
                  onClick={() => onView?.(record)}
                  className="gap-2 cursor-pointer"
                >
                  <span>查看详情</span>
                </DropdownMenuItem>
              )}
              {menuOnly && !hideEdit && (canEdit || keepUnauthorized) && (
                <DropdownMenuItem
                  disabled={!onEdit}
                  onClick={() => onEdit?.(record)}
                  className="gap-2 cursor-pointer"
                >
                  <span>编辑记录</span>
                </DropdownMenuItem>
              )}

              {validExtraActions.map((item) => (
                <DropdownMenuItem
                  key={item.label}
                  onClick={() => runAction(item)}
                  className={cn(
                    "gap-2 cursor-pointer",
                    item.variant === "destructive" && "text-destructive",
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>

            {showDelete && (
              <>
                {(menuHasBuiltIn || validExtraActions.length > 0) && (
                  <DropdownMenuSeparator />
                )}
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    disabled={deleteDisabled}
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <span>删除记录</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            )}
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
          variant={
            activeConfirmAction.variant === "destructive"
              ? "destructive"
              : "default"
          }
          onConfirm={async () => {
            await activeConfirmAction.onClick(record);
            setActiveConfirmAction(null);
          }}
        />
      )}
    </div>
  );
}
