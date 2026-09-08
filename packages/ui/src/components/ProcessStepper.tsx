import React, { type ReactNode } from "react";
import { cn } from "../lib/utils";

export interface ProcessStepItem {
    readonly id: string;
    readonly stepNumber: string;
    readonly title: string;
    readonly statusLabel: string;
    readonly metric: string;
    readonly icon: ReactNode;
    readonly state: "completed" | "active" | "pending";
}

export interface BottomMetricItem {
    readonly label: string;
    readonly mainValue: string;
    readonly subValue: string;
    readonly progressPercent?: number;
}

export interface ProcessStepperProps {
    readonly title?: string;
    readonly subTitle?: string;
    readonly viewAllText?: string;
    readonly onViewAll?: () => void;
    readonly steps: readonly ProcessStepItem[];
    readonly bottomMetrics?: readonly BottomMetricItem[];
    readonly className?: string;
}

/**
 * 业务全链路流程步进组件 (Process Pipeline Stepper)
 * 专为现代数字化央厨与离散制造订单执行全链路打造
 */
export function ProcessStepper({
    title = "净菜订单执行进度 · 经营全链路",
    viewAllText = "查看全部任务",
    onViewAll,
    steps,
    bottomMetrics,
    className,
}: ProcessStepperProps) {
    return (
        <div
            className={cn(
                "rounded-2xl border border-slate-100 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900",
                className,
            )}
        >
            {/* 顶部标题区 */}
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-xs font-medium text-slate-400">
                        经营全链路
                    </span>
                    <h4 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        {title}
                    </h4>
                </div>
                {viewAllText && (
                    <button
                        type="button"
                        onClick={onViewAll}
                        className="group flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors dark:text-blue-400"
                    >
                        <span>{viewAllText}</span>
                        <span className="transition-transform group-hover:translate-x-0.5">
                            →
                        </span>
                    </button>
                )}
            </div>

            {/* 流程节点图 */}
            <div className="relative mt-8 mb-6">
                {/* 背景连接线 */}
                <div className="absolute top-5 left-8 right-8 h-0.5 bg-slate-100 -z-0 dark:bg-slate-800" />

                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 relative z-10">
                    {steps.map((step) => {
                        const isActive = step.state === "active";
                        const isCompleted = step.state === "completed";

                        return (
                            <div
                                key={step.id}
                                className="flex flex-col items-center text-center group cursor-pointer"
                            >
                                {/* 节点图标圆圈 */}
                                <div
                                    className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
                                        isActive
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-100 dark:ring-blue-900/50 scale-110"
                                            : isCompleted
                                              ? "border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                                              : "border border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-900",
                                    )}
                                >
                                    {step.icon}
                                </div>

                                {/* 步骤标号与名称 */}
                                <div className="mt-3">
                                    <div className="text-[10px] font-semibold text-slate-400">
                                        {step.stepNumber}
                                    </div>
                                    <div
                                        className={cn(
                                            "text-xs font-bold transition-colors",
                                            isActive
                                                ? "text-blue-600 dark:text-blue-400"
                                                : "text-slate-800 dark:text-slate-200",
                                        )}
                                    >
                                        {step.title}
                                    </div>
                                </div>

                                {/* 辅助状态与数值 */}
                                <div className="mt-1 text-[11px] text-slate-400">
                                    {step.statusLabel}
                                </div>
                                <div
                                    className={cn(
                                        "mt-0.5 text-xs font-bold tabular-nums",
                                        isActive
                                            ? "text-blue-600 dark:text-blue-400"
                                            : "text-slate-700 dark:text-slate-300",
                                    )}
                                >
                                    {step.metric}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 底部保障指标三联卡 */}
            {bottomMetrics && bottomMetrics.length > 0 && (
                <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 dark:border-slate-800">
                    {bottomMetrics.map((item, index) => (
                        <div
                            key={index}
                            className="flex flex-col justify-between border-l-2 border-blue-600 pl-3"
                        >
                            <div className="text-[11px] font-medium text-slate-400">
                                {item.label}
                            </div>
                            <div className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                                {item.mainValue}
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-500">
                                {item.subValue}
                            </div>
                            {typeof item.progressPercent === "number" && (
                                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500"
                                        style={{
                                            width: `${Math.min(item.progressPercent, 100)}%`,
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
