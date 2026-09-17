"use client";

import { useState, type ReactNode } from "react";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "../shadcn/button";
import { Badge } from "../shadcn/badge";
import { Avatar, AvatarFallback } from "../shadcn/avatar";
import { SidebarTrigger } from "../shadcn/sidebar";

export interface TopHeaderProps {
  readonly user?: {
    name?: string | null;
    email: string;
    /** 用户角色标识（如 "超级管理员"、"拥有者 / Owner"、"企业管理员"、"采购员" 等） */
    role?: string | null;
  } | null;
  /** 平台标识徽标（例如控制平台可显示 "总管理平台" 或 "平台总控端"，租户端可不传） */
  readonly platformBadge?: ReactNode;
  readonly orgSwitcherSlot?: ReactNode;
  readonly onSignOut?: () => void | Promise<void>;
  readonly onOpenLogin?: () => void;
  /** 是否显示侧边栏折叠触发器，默认 true */
  readonly showSidebarTrigger?: boolean;
}

/**
 * ERP 统一后台顶部栏
 * 包含：系统品牌、租户切换槽位、当前用户信息与安全退出/登录操作
 */
export function TopHeader({
  user,
  platformBadge,
  orgSwitcherSlot,
  onSignOut,
  onOpenLogin,
  showSidebarTrigger = true,
}: TopHeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const safeNavigateToLogin = () => {
    if (typeof window !== "undefined") {
      window.location.assign("/login");
    }
  };

  const handleSignOutClick = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      if (onSignOut) {
        await onSignOut();
      } else {
        safeNavigateToLogin();
      }
    } catch {
      safeNavigateToLogin();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLoginClick = () => {
    if (onOpenLogin) {
      onOpenLogin();
    } else {
      safeNavigateToLogin();
    }
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "";
  const initial = (displayName || user?.email || "?")[0]?.toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-40 flex h-12 w-full items-center justify-between border-b border-sidebar-border bg-sidebar px-3 text-sidebar-foreground md:px-4">
      <div className="flex min-w-0 items-center gap-2.5 md:gap-3">
        {showSidebarTrigger ? (
          <SidebarTrigger className="-ml-1 h-7 w-7" />
        ) : null}

        <div
          className="flex items-center gap-2.5 cursor-default select-none"
          title="宸润数智 ERP - 数字化供应链与制造运营系统"
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-xs font-black text-sidebar-primary-foreground shadow-xs">
            CR
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
              宸润数智 ERP
            </span>
            {platformBadge ? (
              platformBadge
            ) : (
              <Badge
                variant="secondary"
                className="h-4.5 px-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                SaaS Pro
              </Badge>
            )}
          </div>
        </div>

        {user && orgSwitcherSlot ? (
          <div className="flex items-center gap-2.5 pl-1">
            <div className="h-3.5 w-px bg-sidebar-border/80" />
            {orgSwitcherSlot}
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
        {user ? (
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 rounded-md py-0.5 px-1.5 transition-colors hover:bg-muted/40"
              title={user.email}
            >
              <Avatar className="size-6">
                <AvatarFallback className="bg-sidebar-primary text-[10px] font-bold text-sidebar-primary-foreground">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1.5 text-left leading-none">
                <span className="text-xs font-medium text-sidebar-foreground max-w-[100px] md:max-w-[140px] truncate">
                  {displayName}
                </span>
                {user.role ? (
                  <span className="inline-flex items-center rounded-xs bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary leading-none">
                    {user.role}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="h-3.5 w-px bg-sidebar-border/80" />

            <Button
              variant="ghost"
              size="sm"
              disabled={isLoggingOut}
              onClick={handleSignOutClick}
              className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer gap-1.5 transition-colors"
              title="安全退出当前账号"
            >
              {isLoggingOut ? (
                <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
              ) : (
                <LogOut className="size-3.5" />
              )}
              <span className="hidden sm:inline">
                {isLoggingOut ? "退出中..." : "退出登录"}
              </span>
            </Button>
          </div>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={handleLoginClick}
            className="h-7 px-3 text-xs font-semibold cursor-pointer"
          >
            登录 / 注册
          </Button>
        )}
      </div>
    </header>
  );
}
