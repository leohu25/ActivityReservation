import React, { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

/**
 * shadcn/ui 徽章变体契约
 * 覆盖现代数智 ERP 央厨场景全语义色系
 */
export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2",
  {
    variants: {
      variant: {
        // 默认品牌蓝
        default:
          "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
        // 深色实心蓝
        primary: "border-transparent bg-blue-600 text-white shadow-xs",
        // 次级灰色
        secondary:
          "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300",
        // 生产合格 / 正常绿色
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
        // 缺口 / 临期预警琥珀橙色
        warning:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
        // 严重异常 / 超期红色
        destructive:
          "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300",
        // 生产计划 / 审核流转紫色
        process:
          "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300",
        // 履约交付 / 调度天蓝色
        dispatch:
          "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300",
        // 线框微标
        outline:
          "border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.2 text-[10px]",
        lg: "px-3 py-1 text-xs",
        // 截图里的方圆小标 (高/中/审/配)
        pillSquare: "px-1.5 py-0.5 text-[11px] font-bold rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * shadcn/ui 徽章组件
 */
export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return React.createElement("div", {
      ref,
      className: cn(badgeVariants({ variant, size }), className),
      ...props,
    });
  },
);
Badge.displayName = "Badge";
