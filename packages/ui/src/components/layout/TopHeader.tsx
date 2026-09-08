"use client";

import { useState, type ReactNode } from "react";
import { Button } from "../button";
import { Loader2 } from "lucide-react";

export interface TopHeaderProps {
  readonly user?: {
    name?: string | null;
    email: string;
  } | null;
  readonly orgSwitcherSlot?: ReactNode;
  readonly onSignOut?: () => void | Promise<void>;
  readonly onOpenLogin?: () => void;
}

/**
 * ERP 统一后台顶部栏 (遵循现代工业轻量数智风)
 * 包含：系统品牌、租户切换槽位、当前用户信息与安全退出/登录操作
 */
export function TopHeader({
  user,
  orgSwitcherSlot,
  onSignOut,
  onOpenLogin,
}: TopHeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOutClick = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      if (onSignOut) {
        await onSignOut();
      } else {
        window.location.href = "/login";
      }
    } catch {
      window.location.href = "/login";
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLoginClick = () => {
    if (onOpenLogin) {
      onOpenLogin();
    } else {
      window.location.href = "/login";
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-6 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
      <div className="flex items-center gap-6">
        {/* 系统品牌 Logo 区 */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white font-black text-sm shadow-sm shadow-blue-500/25 ring-1 ring-blue-500/20">
            CR
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                宸润数智 ERP
              </span>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60">
                SaaS Pro
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              数字化供应链与制造运营系统
            </p>
          </div>
        </div>

        {/* 租户组织切换器槽位 */}
        {user && orgSwitcherSlot}
      </div>

      {/* 右侧用户操作区 */}
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 py-1 pl-1.5 pr-3 dark:border-slate-800 dark:bg-slate-800/80">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-xs">
                {(user.name || user.email)[0]?.toUpperCase()}
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {user.name || user.email.split("@")[0]}
                </span>
                <span className="text-[10px] text-slate-400">{user.email}</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={isLoggingOut}
              onClick={handleSignOutClick}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              {isLoggingOut && (
                <Loader2 className="size-3 animate-spin mr-1 text-slate-500" />
              )}
              <span>{isLoggingOut ? "退出中..." : "退出登录"}</span>
            </Button>
          </div>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={handleLoginClick}
            className="font-bold shadow-sm shadow-blue-600/20 cursor-pointer"
          >
            登录 / 注册
          </Button>
        )}
      </div>
    </header>
  );
}
