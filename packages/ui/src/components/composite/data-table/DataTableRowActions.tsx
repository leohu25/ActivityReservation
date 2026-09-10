"use client";

import { type ReactNode, useState } from "react";
import { MoreHorizontal, Eye, Edit2, Trash2 } from "lucide-react";
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

export interface RowActionItem<TRecord> {
  label: string;
  icon?: ReactNode;
  action?: string;
  variant?: "default" | "destructive";
  onClick: (record: TRecord) => void | Promise<void>;
  confirm?: {
    title: string;
    description?: string;
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
  };
  /** 扩展菜单项 */
  extraActions?: readonly RowActionItem<TRecord>[];
}

export function DataTableRowActions<TRecord>({
  record,
  onView,
  onEdit,
  onDelete,
  deleteConfirm,
  extraActions = [],
}: DataTableRowActionsProps<TRecord>) {
  const { subject, ability } = useDataTableContext();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // 校验是否有对应的操作权限 (严格遵循 Fail-Closed 原则)
  const canPerform = (actionName: string) => {
    if (!subject) return true;
    if (!ability) return false;
    return ability.can(actionName, subject);
  };

  const canView = onView ? canPerform("read") : false;
  const canEdit = onEdit ? canPerform("update") : false;
  const canDelete = onDelete ? canPerform("delete") : false;

  const validExtraActions = extraActions.filter((item) =>
    item.action ? canPerform(item.action) : true,
  );

  const hasAnyAction =
    canView || canEdit || canDelete || validExtraActions.length > 0;

  if (!hasAnyAction) {
    return null;
  }

  return (
    <>
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
          {canView && (
            <DropdownMenuItem
              onClick={() => onView?.(record)}
              className="gap-2 cursor-pointer"
            >
              <Eye className="size-3.5 text-muted-foreground" />
              <span>查看详情</span>
            </DropdownMenuItem>
          )}

          {canEdit && (
            <DropdownMenuItem
              onClick={() => onEdit?.(record)}
              className="gap-2 cursor-pointer"
            >
              <Edit2 className="size-3.5 text-muted-foreground" />
              <span>编辑记录</span>
            </DropdownMenuItem>
          )}

          {validExtraActions.map((item, idx) => (
            <DropdownMenuItem
              key={idx}
              onClick={() => item.onClick(record)}
              className={`gap-2 cursor-pointer ${
                item.variant === "destructive" ? "text-destructive" : ""
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </DropdownMenuItem>
          ))}

          {canDelete && (
            <>
              {(canView || canEdit || validExtraActions.length > 0) && (
                <DropdownMenuSeparator />
              )}
              <DropdownMenuItem
                onClick={() => setDeleteConfirmOpen(true)}
                className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="size-3.5" />
                <span>删除记录</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
          variant="destructive"
          onConfirm={async () => {
            await onDelete?.(record);
          }}
        />
      )}
    </>
  );
}
