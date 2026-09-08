import React, { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../lib/utils";

/**
 * shadcn/ui Card 容器组件
 */
export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return React.createElement("div", {
      ref,
      className: cn(
        "rounded-2xl border border-zinc-200 bg-white text-zinc-950 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50",
        className,
      ),
      ...props,
    });
  },
);
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return React.createElement("div", {
      ref,
      className: cn("flex flex-col space-y-1.5 p-6", className),
      ...props,
    });
  },
);
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return React.createElement("h3", {
      ref,
      className: cn("text-lg font-bold leading-none tracking-tight", className),
      ...props,
    });
  },
);
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return React.createElement("p", {
      ref,
      className: cn("text-xs text-zinc-500 dark:text-zinc-400", className),
      ...props,
    });
  },
);
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return React.createElement("div", {
      ref,
      className: cn("p-6 pt-0", className),
      ...props,
    });
  },
);
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return React.createElement("div", {
      ref,
      className: cn("flex items-center p-6 pt-0", className),
      ...props,
    });
  },
);
CardFooter.displayName = "CardFooter";
