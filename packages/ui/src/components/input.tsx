import React, { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

/**
 * shadcn/ui 输入框组件
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return React.createElement("input", {
      type,
      className: cn(
        "flex h-9 w-full rounded-xl border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-zinc-950 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:file:text-zinc-50 dark:placeholder:text-zinc-400 dark:focus-visible:ring-blue-500",
        className,
      ),
      ref,
      ...props,
    });
  },
);
Input.displayName = "Input";
