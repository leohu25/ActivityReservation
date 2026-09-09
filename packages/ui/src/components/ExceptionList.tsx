import React, { type ReactNode } from "react";
import { cn } from "../lib/utils";
import { Badge, type BadgeProps } from "./primitives/badge";

export interface ExceptionItem {
      readonly id: string;
      /** 优先级标签文字 (如 "高", "中", "审", "配") */
      readonly levelLabel: string;
      /** 优先级对应的语义色 */
      readonly levelVariant: BadgeProps["variant"];
      /** 待办主标题 (如 "原料批次临期", "采购缺口待处理") */
      readonly title: string;
      /** 详细业务说明 (如 "净土豆块原料 3 批将在 24 小时内到期") */
      readonly description: string;
      /** 归属业务中心标签 (如 "库存中心", "采购中心") */
      readonly domainName: string;
      /** 点击项的回调 */
      readonly onClick?: () => void;
}

export interface ExceptionListProps {
      readonly title?: string;
      readonly totalCount?: number;
      readonly completedCount?: number;
      readonly onViewHistory?: () => void;
      readonly onViewAllTasks?: () => void;
      readonly items: readonly ExceptionItem[];
      readonly className?: string;
}

/**
 * 待办与异常决策中心组件 (Exception & Decision Center)
 * 采用分级微标与卡片列表，直观指引车间与业务处置
 */
export function ExceptionList({
      title = "待办与异常 · 经营决策",
      totalCount,
      completedCount = 18,
      onViewHistory,
      onViewAllTasks,
      items,
      className,
}: ExceptionListProps) {
      return (
            <div
                  className={cn(
                        "flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900",
                        className,
                  )}
            >
                  <div>
                        {/* 顶部标题与数量 */}
                        <div className="flex items-center justify-between">
                              <div>
                                    <span className="text-xs font-medium text-slate-400">
                                          优先处理
                                    </span>
                                    <h4 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                          {title}
                                    </h4>
                              </div>
                              {typeof totalCount === "number" && (
                                    <button
                                          type="button"
                                          onClick={onViewAllTasks}
                                          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer dark:text-slate-400 dark:hover:text-slate-200"
                                    >
                                          <span>{totalCount} 项</span>
                                          <span>→</span>
                                    </button>
                              )}
                        </div>

                        {/* 待办异常项列表 */}
                        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                              {items.map((item) => (
                                    <div
                                          key={item.id}
                                          onClick={item.onClick}
                                          className="group flex items-center justify-between py-3 cursor-pointer transition-colors hover:bg-slate-50/80 -mx-2 px-2 rounded-lg dark:hover:bg-slate-800/50"
                                    >
                                          <div className="flex items-center gap-3">
                                                {/* 分级微标 (高/中/审/配) */}
                                                <Badge
                                                      variant={
                                                            item.levelVariant
                                                      }
                                                      size="pillSquare"
                                                      className="shrink-0 font-bold"
                                                >
                                                      {item.levelLabel}
                                                </Badge>

                                                {/* 待办标题与上下文 */}
                                                <div>
                                                      <div className="text-xs font-bold text-slate-800 transition-colors group-hover:text-blue-600 dark:text-slate-200 dark:group-hover:text-blue-400">
                                                            {item.title}
                                                      </div>
                                                      <div className="text-[11px] text-slate-400 mt-0.5">
                                                            {item.description}
                                                      </div>
                                                </div>
                                          </div>

                                          {/* 右侧业务域与跳转提示 */}
                                          <div className="flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0">
                                                <span>{item.domainName}</span>
                                                <span className="transition-transform group-hover:translate-x-0.5">
                                                      ›
                                                </span>
                                          </div>
                                    </div>
                              ))}
                        </div>
                  </div>

                  {/* 底部今日已处理与主入口 */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs dark:border-slate-800">
                        <div
                              onClick={onViewHistory}
                              className="flex items-center gap-1 text-slate-500 cursor-pointer hover:text-slate-800 dark:hover:text-slate-300"
                        >
                              <span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] text-emerald-600">
                                    ✓
                              </span>
                              <span>今日已处理 {completedCount} 项</span>
                        </div>

                        <button
                              type="button"
                              onClick={onViewAllTasks}
                              className="font-semibold text-blue-600 hover:underline cursor-pointer dark:text-blue-400"
                        >
                              进入我的任务
                        </button>
                  </div>
            </div>
      );
}
