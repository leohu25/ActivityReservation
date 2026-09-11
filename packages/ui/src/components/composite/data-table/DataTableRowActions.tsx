"use client";

import React, { type ReactNode, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../primitives/dropdown-menu";
import { Button } from "../../primitives/button";
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
   * 未提供时自动根据 onView/onEdit 生成默认平铺项。
   */
  inlineActions?: readonly RowActionItem<TRecord>[];
  /** 次要/危险操作，折叠进 `...` 下拉菜单 */
  extraActions?: readonly RowActionItem<TRecord>[];
  /** 是否强制使用纯下拉菜单模式（忽略 onView/onEdit 默认平铺） */
  menuOnly?: boolean;
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
  className,
}: DataTableRowActionsProps<TRecord>) {
  const { subject, ability } = useDataTableContext();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeConfirmAction, setActiveConfirmAction] =
    useState<RowActionItem<TRecord> | null>(null);

  // 校验是否有对应的操作权限 (严格遵循 Fail-Closed 原则)
  const canPerform = (actionName: string) => {
    if (!subject) return true;
    if (!ability) return false;
    return ability.can(actionName, subject);
  };

  const canView = onView ? canPerform("read") : false;
  const canEdit = onEdit ? canPerform("update") : false;
  const canDelete = onDelete ? canPerform("delete") : false;

  // 构建平铺操作列表
  const resolvedInline: RowActionItem<TRecord>[] = React.useMemo(() => {
    if (inlineActions) {
      return inlineActions.filter((item) =>
        item.action ? canPerform(item.action) : true,
      );
    }
    if (menuOnly) return [];
    const defaults: RowActionItem<TRecord>[] = [];
    if (canView && onView) {
      defaults.push({
        label: "详情",
        action: "read",
        onClick: () => onView(record),
      });
    }
    if (canEdit && onEdit) {
      defaults.push({
        label: "编辑",
        action: "update",
        onClick: () => onEdit(record),
      });
    }
    return defaults;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inlineActions, menuOnly, canView, canEdit, onView, onEdit, record, subject, ability]);

  const validExtraActions = extraActions.filter((item) =>
    item.action ? canPerform(item.action) : true,
  );

  // 若提供了 inlineActions，删除/查看/编辑也可按需放入下拉
  const menuHasBuiltIn = menuOnly && (canView || canEdit);
  const hasAnyAction =
    resolvedInline.length > 0 ||
    canDelete ||
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
      {/* 平铺文本链接操作 */}
      {resolvedInline.map((item) => (
        <Button
          key={item.label}
          type="button"
          variant="link"
          size="sm"
          className={cn(
            "h-auto p-0 px-1 text-xs font-medium no-underline hover:underline",
            item.variant === "destructive"
              ? "text-destructive"
              : "text-primary",
            item.inlineClassName,
          )}
          onClick={() => runAction(item)}
        >
          {item.label}
        </Button>
      ))}

      {/* 次要/危险操作折叠菜单 */}
      {(validExtraActions.length > 0 ||
        canDelete ||
        (menuOnly && (canView || canEdit))) && (
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
            {menuOnly && canView && onView && (
              <DropdownMenuItem
                onClick={() => onView(record)}
                className="gap-2 cursor-pointer"
              >
                <span>查看详情</span>
              </DropdownMenuItem>
            )}
            {menuOnly && canEdit && onEdit && (
              <DropdownMenuItem
                onClick={() => onEdit(record)}
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

            {canDelete && (
              <>
                {(menuHasBuiltIn || validExtraActions.length > 0) && (
                  <DropdownMenuSeparator />
                )}
                <DropdownMenuItem
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <span>删除记录</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* 内置二次确认防误删弹窗 */}
      {canDelete && (
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
