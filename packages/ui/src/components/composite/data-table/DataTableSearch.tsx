"use client";

import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "../../shadcn/input";
import { cn } from "../../../lib/utils";

export interface DataTableSearchProps {
  /** 外部绑定的搜索值（可选受控） */
  value?: string;
  /** 搜索值变更回调 */
  onChange?: (val: string) => void;
  /** 点击回车或点击搜索按钮时立即触发 */
  onSearch?: (val: string) => void;
  /** 占位文字，默认 "搜索关键字..." */
  placeholder?: string;
  /** 防抖时间 (毫秒)，默认 300ms */
  debounceMs?: number;
  className?: string;
}

export function DataTableSearch({
  value: controlledValue,
  onChange,
  onSearch,
  placeholder = "搜索关键字...",
  debounceMs = 300,
  className,
}: DataTableSearchProps) {
  const [internalValue, setInternalValue] = useState(controlledValue || "");

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  useEffect(() => {
    if (debounceMs <= 0) return;
    const timer = setTimeout(() => {
      onChange?.(internalValue);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [internalValue, debounceMs, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch?.(internalValue);
    }
  };

  const handleClear = () => {
    setInternalValue("");
    onChange?.("");
    onSearch?.("");
  };

  return (
    <div
      className={cn(
        "relative flex items-center min-w-[200px] max-w-sm",
        className,
      )}
    >
      <Search className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none" />
      <Input
        value={internalValue}
        onChange={(e) => {
          setInternalValue(e.target.value);
          if (debounceMs <= 0) {
            onChange?.(e.target.value);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-8 pl-8 pr-7 text-xs bg-background/50 shadow-none border-border/70 focus-visible:bg-background"
      />
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 text-muted-foreground hover:text-foreground p-0.5 rounded-sm"
          title="清空搜索"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}
