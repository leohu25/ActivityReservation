"use client";

import * as React from "react";
import {
        DataTableContext,
        type ColumnDef,
        type DataTableContextValue,
} from "./DataTableContext";
import { cn } from "../../../lib/utils";

export interface DataTableRootProps<TData> {
        data: readonly TData[];
        columns: readonly ColumnDef<TData>[];
        rowKey: (record: TData) => string;
        isLoading?: boolean;
        page?: number;
        pageSize?: number;
        total?: number;
        onPageChange?: (page: number, pageSize: number) => void;
        subject?: string;
        ability?: {
                can(action: string, subject: string, field?: string): boolean;
        };
        children: React.ReactNode;
        className?: string;
}

export function DataTableRoot<TData>({
        data,
        columns,
        rowKey,
        isLoading = false,
        page,
        pageSize,
        total,
        onPageChange,
        subject,
        ability,
        children,
        className,
}: DataTableRootProps<TData>) {
        const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(
                new Set(),
        );
        const [expandedRowKeys, setExpandedRowKeys] = React.useState<
                Set<string>
        >(new Set());

        const allRowKeys = React.useMemo(
                () => data.map((item) => rowKey(item)),
                [data, rowKey],
        );

        const isAllSelected = React.useMemo(
                () =>
                        allRowKeys.length > 0 &&
                        allRowKeys.every((key) => selectedKeys.has(key)),
                [allRowKeys, selectedKeys],
        );

        const isAnySelected = selectedKeys.size > 0;

        const toggleSelectRow = (key: string) => {
                setSelectedKeys((prev) => {
                        const next = new Set(prev);
                        if (next.has(key)) {
                                next.delete(key);
                        } else {
                                next.add(key);
                        }
                        return next;
                });
        };

        const toggleSelectAll = () => {
                if (isAllSelected) {
                        setSelectedKeys(new Set());
                } else {
                        setSelectedKeys(new Set(allRowKeys));
                }
        };

        const clearSelection = () => {
                setSelectedKeys(new Set());
        };

        const toggleExpandRow = (key: string) => {
                setExpandedRowKeys((prev) => {
                        const next = new Set(prev);
                        if (next.has(key)) {
                                next.delete(key);
                        } else {
                                next.add(key);
                        }
                        return next;
                });
        };

        const value = React.useMemo<DataTableContextValue<TData>>(
                () => ({
                        data,
                        columns,
                        rowKey,
                        isLoading,
                        selectedKeys,
                        toggleSelectRow,
                        toggleSelectAll,
                        clearSelection,
                        isAllSelected,
                        isAnySelected,
                        expandedRowKeys,
                        toggleExpandRow,
                        page,
                        pageSize,
                        total,
                        onPageChange,
                        subject,
                        ability,
                }),
                [
                        data,
                        columns,
                        rowKey,
                        isLoading,
                        selectedKeys,
                        isAllSelected,
                        isAnySelected,
                        expandedRowKeys,
                        page,
                        pageSize,
                        total,
                        onPageChange,
                        subject,
                        ability,
                ],
        );

        return (
                <DataTableContext.Provider value={value}>
                        <div
                                className={cn(
                                        "flex flex-col gap-3 w-full",
                                        className,
                                )}
                        >
                                {children}
                        </div>
                </DataTableContext.Provider>
        );
}
