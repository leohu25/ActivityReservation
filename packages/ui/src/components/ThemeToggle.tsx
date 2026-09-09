"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "../lib/utils";

export interface ThemeToggleProps {
  readonly className?: string;
  readonly showLabels?: boolean;
}

/**
 * 三态主题切换组件 (支持暗色、亮色、跟随系统)
 * 采用工业级分段胶囊设计，即时反馈当前激活状态
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
      <div
        className={cn(
          "inline-flex h-8 w-[102px] items-center justify-center rounded-lg border bg-muted/40 animate-pulse",
          className,
        )}
        aria-hidden="true"
      />
    );
  }

  const options = [
    {
      key: "light",
      label: "亮色",
      icon: Sun,
    },
    {
      key: "dark",
      label: "暗色",
      icon: Moon,
    },
    {
      key: "system",
      label: "系统",
      icon: Monitor,
    },
  ] as const;

  return (
    <div
      role="group"
      aria-label="主题模式切换"
      className={cn(
        "inline-flex items-center rounded-lg border bg-muted/50 p-0.5 text-xs shadow-xs",
        className,
      )}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => setTheme(opt.key)}
            title={`切换为${opt.label}模式`}
            aria-pressed={isActive}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all duration-150 cursor-pointer",
              isActive
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40",
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            {showLabels && <span>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
