"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../shadcn/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../shadcn/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../shadcn/command";

export interface ComboboxOption {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
  readonly disabled?: boolean;
}

export interface ComboboxProps {
  readonly value?: string | null;
  readonly onChange?: (value: string) => void;
  readonly options: readonly ComboboxOption[];
  readonly placeholder?: string;
  readonly searchPlaceholder?: string;
  readonly emptyText?: string;
  readonly disabled?: boolean;
  readonly clearable?: boolean;
  readonly className?: string;
  readonly popoverClassName?: string;
  readonly popoverWidth?: number | string;
  /** 是否以模态浮层形式呈现（在 Dialog/Modal 弹窗内使用时必须为 true，以允许鼠标滚轮正常滚动） */
  readonly modal?: boolean;
}

/**
 * 业务中立企业级通用 Combobox 组件 (基于 shadcn Popover + Command)
 * 适用于客户、供应商、商品、门店等具备检索需求的主数据/大枚举选择场景
 */
export function Combobox({
  value,
  onChange,
  options,
  placeholder = "请选择...",
  searchPlaceholder = "输入关键字搜索...",
  emptyText = "未找到匹配项",
  disabled = false,
  clearable = false,
  className,
  popoverClassName,
  popoverWidth,
  modal = true,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = React.useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );

  const handleSelect = React.useCallback(
    (currentValue: string) => {
      if (currentValue === value && clearable) {
        onChange?.("");
      } else {
        onChange?.(currentValue);
      }
      setOpen(false);
    },
    [value, clearable, onChange],
  );

  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.("");
    },
    [onChange],
  );

  return (
    <Popover open={open} onOpenChange={setOpen} modal={modal}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal text-xs h-9 px-3",
            !selectedOption && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {clearable && value && !disabled && (
              <X
                className="size-3.5 opacity-40 hover:opacity-100 transition-opacity"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="size-3.5 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn(
          "p-0 w-[--radix-popover-trigger-width] min-w-[200px]",
          popoverClassName,
        )}
        style={popoverWidth ? { width: popoverWidth } : undefined}
      >
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            className="h-8 text-xs"
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = value === option.value;
                return (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value} ${option.description ?? ""}`}
                    disabled={option.disabled}
                    onSelect={() => handleSelect(option.value)}
                    className="text-xs cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 size-3.5 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate font-medium">
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="text-[10px] text-muted-foreground truncate">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
