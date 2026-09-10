"use client";

import * as React from "react";
import {
        DataTableContext,
        type ColumnDef,
        type DataTableContextValue,
} from "./DataTableContext";
import { cn } from "../../../lib/utils";

export interface PlainTablePermissions {
        readonly actions: readonly string[];
        readonly fieldPolicies?: Readonly<Record<string, string>>;
}

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
        /** 支持传入传统的 Ability 实例 */
        ability?: {
                can(action: string, subject: string, field?: string): boolean;
        };
        /** 针对 Next.js Server Component 跨边界传递：支持直接传入纯 JSON 权限数据，无需传递函数 */
        permissions?: PlainTablePermissions;
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
        ability: explicitAbility,
        permissions,
        children,
        className,
}: DataTableRootProps<TData>) {
        const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(
                new Set(),
        );
        const [expandedRowKeys, setExpandedRowKeys] = React.useState<
                Set<string>
        >(new Set());

        // 自动从纯 JSON permissions 派生客户端可执行的 ability (完美契合 RSC 边界规范)
        const effectiveAbility = React.useMemo(() => {
                if (explicitAbility) {
                        return explicitAbility;
                }
                if (!permissions) {
                        return undefined;
                }
                return {
                        can(action: string, s: string, field?: string) {
                                if (subject && s && s !== subject) {
                                        return false;
                                }
                                if (!permissions.actions.includes(action)) {
                                        return false;
                                }
                                if (
                                        field &&
                                        permissions.fieldPolicies?.[field] ===
                                                "HIDDEN"
                                ) {
                                        return false;
                                }
                                return true;
                        },
                };
        }, [explicitAbility, permissions, subject]);

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
                        ability: effectiveAbility,
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
                        effectiveAbility,
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
