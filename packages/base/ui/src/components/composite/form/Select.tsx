"use client";

import * as React from "react";
import { Select as ShadcnSelect } from "../../shadcn/select";

/**
 * 递归从 React 子节点中提取选项的 value 与 label 对应关系，
 * 解决 Base UI 在未显式传 items 时 Select.Value 回显只能展示原始 value (如 "MONTHLY", "ALL") 而无法展示中文 label 的问题。
 */
function extractItemsFromChildren(
  children: React.ReactNode,
): Record<string, React.ReactNode> {
  const items: Record<string, React.ReactNode> = {};

  function traverse(node: React.ReactNode) {
    if (!node) return;
    if (Array.isArray(node)) {
      for (const child of node) {
        traverse(child);
      }
      return;
    }
    if (React.isValidElement(node)) {
      const props = node.props as Record<string, unknown>;
      if (props) {
        if (
          "value" in props &&
          props.value !== undefined &&
          props.value !== null
        ) {
          const valKey = String(props.value);
          const label = (props.label ??
            props.children ??
            valKey) as React.ReactNode;
          items[valKey] = label;
        }
        if (props.children) {
          traverse(props.children as React.ReactNode);
        }
      }
    }
  }

  traverse(children);
  return items;
}

export type SelectProps<
  Value = any,
  Multiple extends boolean | undefined = false,
> = React.ComponentProps<typeof ShadcnSelect<Value, Multiple>>;

/**
 * 复合层 Select：保持 shadcn 官方原子组件 100% 纯净，
 * 自动从 children 声明的 SelectItem 中提取 value 与中文 label 映射并下推至 Base UI items，
 * 彻底解决未显式传 items 时 SelectTrigger 中 SelectValue 回显英文/枚举编码（如 MONTHLY, ALL）而非中文名称的缺陷。
 */
export function Select<
  Value = any,
  Multiple extends boolean | undefined = false,
>({ children, items: propItems, ...props }: SelectProps<Value, Multiple>) {
  const resolvedItems = React.useMemo(() => {
    if (propItems) return propItems;
    return extractItemsFromChildren(children);
  }, [children, propItems]);

  return (
    <ShadcnSelect items={resolvedItems} {...props}>
      {children}
    </ShadcnSelect>
  );
}
