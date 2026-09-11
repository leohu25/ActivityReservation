"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./shadcn/card";
import { Input } from "./shadcn/input";
import { Badge } from "./shadcn/badge";
import { cn } from "../lib/utils";

/**
 * 字典项条目契约
 */
export interface DictionaryItem {
  /** 唯一主键标识 */
  key: string;
  /** 编码代号，如 CUST_CAT_001 */
  code: string;
  /** 显示名称，如 品牌连锁企业 */
  name: string;
  /** 分类/类型微徽章，如 配送策略 */
  typeTag?: string;
  /** 上级或层级从属描述，如 （父级: CAT_01） */
  parentInfo?: string | null;
  /** 详细描述文本 */
  description?: string | null;
  /** 状态标识，如 ACTIVE | DISABLED */
  status: "ACTIVE" | "DISABLED" | string;
  /** 状态切换或管理操作区 */
  actions?: React.ReactNode;
}

/**
 * 字典卡片组件入参属性
 */
export interface DictionarySectionCardProps {
  /** 字典标题 */
  title: string;
  /** 字典用途说明 */
  description?: string;
  /** 标题前置图标 */
  icon?: React.ReactNode;
  /** 顶部右侧新增操作按钮 */
  actionButton?: React.ReactNode;
  /** 本地快速搜索提示文本 */
  searchPlaceholder?: string;
  /** 字典条目数据集 */
  items: DictionaryItem[];
  /** 空状态展示文本 */
  emptyText?: string;
  /** 容器额外类名 */
  className?: string;
}

/**
 * 企业级字典与分类管理卡片组件
 * 基于 shadcn/ui 的 Card、Badge、Button、Input 原生组件组装
 * 适用于：数据字典、客户标签、多级分类树、码表维护
 */
export function DictionarySectionCard({
  title,
  description,
  icon,
  actionButton,
  searchPlaceholder = "快速搜索编码、名称...",
  items,
  emptyText = "暂无相关字典记录",
  className,
}: DictionarySectionCardProps) {
  const [keyword, setKeyword] = useState("");

  const filteredItems = items.filter((item) => {
    if (!keyword) return true;
    const kw = keyword.toLowerCase();
    return (
      item.code.toLowerCase().includes(kw) ||
      item.name.toLowerCase().includes(kw) ||
      (item.description && item.description.toLowerCase().includes(kw))
    );
  });

  return (
    <Card className={cn("flex flex-col shadow-xs border bg-card", className)}>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                {icon}
              </div>
            )}
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          {actionButton}
        </div>

        {/* 字典内快速过滤栏 */}
        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 pl-8 text-xs bg-background"
          />
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1">
        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              {emptyText}
            </div>
          ) : (
            filteredItems.map((item) => {
              const isActive = item.status === "ACTIVE";
              return (
                <div
                  key={item.key}
                  className="group flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/60"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-foreground px-1.5 py-0.5 rounded bg-muted border">
                        {item.code}
                      </span>
                      <span className="text-sm font-medium text-foreground truncate">
                        {item.name}
                      </span>
                      {item.typeTag && (
                        <Badge
                          variant="outline"
                          size="sm"
                          className="text-[11px]"
                        >
                          {item.typeTag}
                        </Badge>
                      )}
                      {item.parentInfo && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {item.parentInfo}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={isActive ? "success" : "secondary"}
                      size="sm"
                    >
                      {isActive ? "启用" : "停用"}
                    </Badge>
                    {item.actions}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
