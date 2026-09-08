import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import { Badge, type BadgeProps } from "./badge";

export interface MetricCardProps {
    /** 指标标题 */
    readonly title: string;
    /** 图标组件 */
    readonly icon?: ReactNode;
    /** 核心数值 (大字号加粗) */
    readonly value: string | number;
    /** 数值单位 (如 "单", "吨", "%", "kg") */
    readonly unit?: string;
    /** 次级提示标签 (如 "+8.2%", "完成 75%", "目标 96%") */
    readonly badgeText?: string;
    /** 次级标签的 Badge 语义变体 */
    readonly badgeVariant?: BadgeProps["variant"];
    /** 补充说明或底部文本 (如 "3 项待采购", "2 批待检") */
    readonly subText?: string;
    /** 图标外层微色块背景类名 (如 "bg-blue-50 text-blue-600") */
    readonly iconBg?: string;
    /** 自定义外部类名 */
    readonly className?: string;
}

/**
 * 现代数智 ERP 核心指标卡 (KPI Ribbon Card)
 * 遵循 shadcn/ui 纯白大圆角卡片，严格应用 tabular-nums
 */
export function MetricCard({
    title,
    icon,
    value,
    unit,
    badgeText,
    badgeVariant = "success",
    subText,
    iconBg = "bg-blue-50 text-blue-600",
    className,
}: MetricCardProps) {
    return (
        <div
            className={cn(
                "group relative flex flex-col justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900",
                className,
            )}
        >
            {/* 顶部标题与微图标 */}
            <div className="flex items-center gap-2">
                {icon && (
                    <div
                        className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-lg text-xs transition-colors",
                            iconBg,
                        )}
                    >
                        {icon}
                    </div>
                )}
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {title}
                </span>
            </div>

            {/* 中部超大核心指标与单位 */}
            <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-slate-100">
                    {value}
                </span>
                {unit && (
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {unit}
                    </span>
                )}
            </div>

            {/* 底部副状态与提示文本 */}
            <div className="mt-2 flex items-center justify-between text-[11px]">
                {badgeText && (
                    <Badge
                        variant={badgeVariant}
                        size="sm"
                        className="font-medium tracking-tight"
                    >
                        {badgeText}
                    </Badge>
                )}
                {subText && (
                    <span className="text-slate-400 dark:text-slate-500">
                        {subText}
                    </span>
                )}
            </div>
        </div>
    );
}
