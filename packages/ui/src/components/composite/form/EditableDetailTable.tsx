"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../shadcn/table";
import { Button } from "../../shadcn/button";

export interface DetailTableColumn<T> {
  id: string;
  header: React.ReactNode;
  width?: number | string;
  align?: "left" | "center" | "right";
  renderCell: (
    row: T,
    index: number,
    onChange?: (updater: Partial<T> | ((prev: T) => T)) => void,
  ) => React.ReactNode;
}

export interface EditableDetailTableProps<T> {
  columns: DetailTableColumn<T>[];
  data: T[];
  onChange?: (data: T[]) => void;
  onAddRow?: () => T;
  addText?: string;
  minRows?: number;
  readOnly?: boolean;
  emptyText?: string;
  className?: string;
}

/**
 * 通用单据明细表格 (EditableDetailTable)
 * - 纯基于 shadcn Table 工业风高密度呈现
 * - 支持动态增删行与行内单元格响应式交互
 * - 兼备只读查看模式 (readOnly) 与可编辑模式
 */
export function EditableDetailTable<T>({
  columns,
  data,
  onChange,
  onAddRow,
  addText = "添加明细",
  minRows = 1,
  readOnly = false,
  emptyText = "暂无明细数据",
  className,
}: EditableDetailTableProps<T>) {
  const handleAdd = () => {
    if (!onAddRow || !onChange) return;
    const newRow = onAddRow();
    onChange([...data, newRow]);
  };

  const handleRemove = (index: number) => {
    if (!onChange) return;
    if (data.length <= minRows) {
      return;
    }
    onChange(data.filter((_, i) => i !== index));
  };

  const handleRowChange = (
    index: number,
    updater: Partial<T> | ((prev: T) => T),
  ) => {
    if (!onChange) return;
    const next = [...data];
    const prevRow = next[index];
    if (!prevRow) return;
    if (typeof updater === "function") {
      next[index] = (updater as (prev: T) => T)(prevRow);
    } else {
      next[index] = { ...prevRow, ...updater };
    }
    onChange(next);
  };

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      {!readOnly && onAddRow && onChange && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="h-7 text-xs"
          >
            <Plus className="size-3 mr-1" />
            {addText}
          </Button>
        </div>
      )}

      <div className="border rounded-lg overflow-x-auto bg-card">
        <Table className="w-full text-xs">
          <TableHeader className="bg-muted/50">
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  style={col.width ? { width: col.width } : undefined}
                  className={`p-2 text-xs font-medium whitespace-nowrap ${
                    col.align === "center"
                      ? "text-center"
                      : col.align === "right"
                        ? "text-right"
                        : "text-left"
                  }`}
                >
                  {col.header}
                </TableHead>
              ))}
              {!readOnly && onChange && (
                <TableHead className="p-2 text-center w-12 whitespace-nowrap">
                  操作
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y">
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (readOnly ? 0 : 1)}
                  className="p-4 text-center text-muted-foreground text-xs"
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => (
                <TableRow key={idx} className="hover:bg-muted/30">
                  {columns.map((col) => (
                    <TableCell
                      key={col.id}
                      className={`p-2 align-middle ${
                        col.align === "center"
                          ? "text-center"
                          : col.align === "right"
                            ? "text-right"
                            : "text-left"
                      }`}
                    >
                      {col.renderCell(
                        row,
                        idx,
                        readOnly
                          ? undefined
                          : (updater) => handleRowChange(idx, updater),
                      )}
                    </TableCell>
                  ))}
                  {!readOnly && onChange && (
                    <TableCell className="p-2 text-center align-middle">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={data.length <= minRows}
                        onClick={() => handleRemove(idx)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive disabled:opacity-30"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
