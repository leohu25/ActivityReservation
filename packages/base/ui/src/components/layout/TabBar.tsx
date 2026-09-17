"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import type { NavSection, NavItem } from "./Sidebar";

export interface TabItem {
  readonly title: string;
  readonly path: string;
  readonly closable?: boolean;
}

export interface TabBarProps {
  /** 默认固定展示的首页标签 */
  readonly homeTab?: TabItem;
  /** 用于根据 pathname 自动匹配标签名称的导航配置 */
  readonly sections?: readonly NavSection[];
  readonly className?: string;
}

const STORAGE_KEY = "cr_dashboard_opened_tabs";

function findTitleByPath(
  sections: readonly NavSection[],
  path: string,
): string | null {
  for (const s of sections) {
    for (const item of s.items) {
      const match = searchTitle(item, path);
      if (match) return match;
    }
  }
  return null;
}

function searchTitle(item: NavItem, path: string): string | null {
  if (item.href && (item.href === path || path.startsWith(`${item.href}/`))) {
    return item.label;
  }
  const subs = item.items || item.children;
  if (subs) {
    for (const sub of subs) {
      const found = searchTitle(sub, path);
      if (found) return found;
    }
  }
  return null;
}

const DEFAULT_HOME_TAB: TabItem = {
  title: "工作台",
  path: "/workbench",
  closable: false,
};

/**
 * ERP 多标签页管理导航栏 (TabBar)
 * 记录用户打开的历史路由，支持点击切换、关闭当前、关闭其他，提供工业级多任务切换能力。
 */
export function TabBar({
  homeTab = DEFAULT_HOME_TAB,
  sections = [],
  className,
}: TabBarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [tabs, setTabs] = useState<TabItem[]>([homeTab]);

  // 初始化从 sessionStorage 读取或添加首个标签
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as TabItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTabs(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // 路由变化时自动同步标签
  useEffect(() => {
    if (!pathname || pathname === "/login") return;

    setTabs((prev) => {
      const exists = prev.some((t) => t.path === pathname);
      if (exists) return prev;

      const title =
        findTitleByPath(sections, pathname) ||
        pathname.split("/").pop() ||
        "新标签";
      const next = [
        ...prev,
        { title, path: pathname, closable: pathname !== homeTab.path },
      ];
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, [pathname, sections, homeTab.path]);

  const closeTab = useCallback(
    (e: React.MouseEvent, path: string) => {
      e.preventDefault();
      e.stopPropagation();

      setTabs((prev) => {
        const next = prev.filter((t) => t.path !== path);
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        if (pathname === path) {
          const last = next[next.length - 1];
          if (last) {
            router.push(last.path);
          } else {
            router.push(homeTab.path);
          }
        }
        return next;
      });
    },
    [pathname, router, homeTab.path],
  );

  return (
    <div
      className={cn(
        "flex h-9 w-full items-center border-b border-border/60 bg-muted/20 px-2 select-none overflow-x-auto no-scrollbar gap-1",
        className,
      )}
    >
      <div className="flex items-center gap-1 min-w-0 flex-1">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path;
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={cn(
                "group relative flex h-7.5 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all",
                isActive
                  ? "bg-background text-foreground shadow-xs border border-border/80 font-semibold"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <span className="truncate max-w-[120px]">{tab.title}</span>
              {tab.closable ? (
                <button
                  type="button"
                  onClick={(e) => closeTab(e, tab.path)}
                  className="size-3.5 rounded-sm p-0 text-muted-foreground/60 opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100 flex items-center justify-center"
                  aria-label={`关闭 ${tab.title}`}
                >
                  <X className="size-3" />
                </button>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
