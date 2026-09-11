"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "./shadcn/toggle-group";
import { Skeleton } from "./shadcn/skeleton";
import { cn } from "../lib/utils";

export interface ThemeToggleProps {
  readonly className?: string;
  readonly showLabels?: boolean;
}

/**
 * 三态主题切换（亮色 / 暗色 / 系统）
 * 基于官方 shadcn ToggleGroup。
 */
export function ThemeToggle({
  className,
  showLabels = false,
}: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Skeleton
        className={cn("h-8 w-[102px] rounded-lg", className)}
        aria-hidden="true"
      />
    );
  }

  const options = [
    { key: "light", label: "亮色", icon: Sun },
    { key: "dark", label: "暗色", icon: Moon },
    { key: "system", label: "系统", icon: Monitor },
  ] as const;

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={theme ?? "system"}
      onValueChange={(value) => {
        if (value) setTheme(value);
      }}
      aria-label="主题模式切换"
      className={cn("bg-muted/50 p-0.5", className)}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        return (
          <ToggleGroupItem
            key={opt.key}
            value={opt.key}
            title={`切换为${opt.label}模式`}
            className="gap-1 px-2"
          >
            <Icon className="size-3.5 shrink-0" />
            {showLabels && <span>{opt.label}</span>}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
