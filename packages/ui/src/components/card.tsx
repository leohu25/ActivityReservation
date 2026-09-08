import React, { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../lib/utils";

/**
 * shadcn/ui Card 容器组件
 * 遵循现代数智工业风：纯白浮动、极细淡边框、柔和微弥散投影
 */
export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return React.createElement("div", {
      ref,
      className: cn(
        "rounded-2xl border border-slate-100 bg-white text-slate-900 shadow-xs transition-all duration-150 dark:border-slate-800/80 dark:bg-slate-900/90 dark:text-slate-100",
        className,
      ),
      ...props,
    });
  },
);
Card.displayName = "Card";

export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return React.createElement("div", {
    ref,
    className: cn("flex flex-col space-y-1.5 p-5", className),
    ...props,
  });
});
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  return React.createElement("h3", {
    ref,
    className: cn(
      "text-sm font-bold leading-none tracking-tight text-slate-800 dark:text-slate-100",
      className,
    ),
    ...props,
  });
});
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return React.createElement("p", {
    ref,
    className: cn("text-xs text-slate-400 dark:text-slate-500", className),
    ...props,
  });
});
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return React.createElement("div", {
    ref,
    className: cn("p-5 pt-0", className),
    ...props,
  });
});
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return React.createElement("div", {
    ref,
    className: cn("flex items-center p-5 pt-0", className),
    ...props,
  });
});
CardFooter.displayName = "CardFooter";
