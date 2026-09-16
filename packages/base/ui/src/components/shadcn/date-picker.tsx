"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export interface DatePickerProps {
  readonly value?: string | Date | null;
  readonly onChange?: (dateStr: string) => void;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly "aria-invalid"?: boolean;
}

/**
 * 现代数智工业风 DatePicker 组件 (基于 shadcn Calendar + Popover + Button)
 * 接收或返回 YYYY-MM-DD 格式字符串或 Date 对象，彻底告别丑陋的原生 `<input type="date" />`
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "请选择日期",
  disabled = false,
  className,
  "aria-invalid": ariaInvalid,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    if (value instanceof Date)
      return isNaN(value.getTime()) ? undefined : value;
    // 防止时区偏移，按本地时间解析 YYYY-MM-DD
    const parts = String(value).split("T")[0]?.split("-");
    if (parts && parts.length === 3) {
      const year = parseInt(parts[0]!, 10);
      const month = parseInt(parts[1]!, 10) - 1;
      const day = parseInt(parts[2]!, 10);
      return new Date(year, month, day);
    }
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }, [value]);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      onChange?.(`${yyyy}-${mm}-${dd}`);
    } else {
      onChange?.("");
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className={cn(
            "w-full justify-start text-left font-normal h-9 px-3 text-xs bg-transparent hover:bg-muted/50 border-input shadow-xs",
            !selectedDate && "text-muted-foreground",
            ariaInvalid && "border-destructive ring-destructive/20",
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-3.5 text-muted-foreground shrink-0" />
          {selectedDate ? (
            <span className="font-mono text-foreground text-xs">
              {format(selectedDate, "yyyy-MM-dd")}
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50 shadow-md" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}
