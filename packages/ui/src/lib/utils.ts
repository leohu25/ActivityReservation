import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 Tailwind CSS 类名的工具函数 (shadcn/ui 标准实现)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
