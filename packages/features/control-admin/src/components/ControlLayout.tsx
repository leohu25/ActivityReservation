"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  ShieldCheck,
  Layers,
  LogOut,
  Loader2,
  Cpu,
} from "lucide-react";

export interface ControlLayoutProps {
  /** 子页面节点 */
  readonly children: React.ReactNode;
}

interface NavItem {
  readonly id: string;
  readonly name: string;
  readonly href: string;
  readonly icon: React.ReactNode;
  readonly description: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  {
    id: "overview",
    name: "总控运营大盘",
    href: "/overview",
    icon: <BarChart3 className="size-4.5" />,
    description: "平台全局指标与健康度",
  },
  {
    id: "tenants",
    name: "租户运维中枢",
    href: "/tenants",
    icon: <Building2 className="size-4.5" />,
    description: "多租户开通与物理库生命周期",
  },
];

/**
 * 平台控制平面 (Control Plane) 统一布局外壳
 * 遵循现代轻量数智风设计规范：极浅冷灰蓝背景 (#F4F7FB)、纯白浮动侧栏与顶栏、科技皇家蓝品牌色
 */
export function ControlLayout({
  children,
}: ControlLayoutProps): React.JSX.Element {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    if (typeof window !== "undefined") {
      window.location.assign("/api/auth/sign-out");
    }
  };

  const currentNav = NAV_ITEMS.find(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`),
  );

  return (
    <div className="flex min-h-screen bg-[#F4F7FB] text-slate-900 font-sans antialiased">
      {/* 左侧控制平面专用侧边栏 */}
      <aside className="w-64 border-r border-slate-200/80 bg-white p-4 flex flex-col justify-between shrink-0 select-none">
        <div className="space-y-6">
          {/* 顶部系统品牌区 */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white font-black text-base shadow-sm shadow-blue-500/25 ring-1 ring-blue-500/20">
              CR
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-slate-900">
                  宸润数智 ERP
                </span>
                <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 border border-blue-200/60">
                  Control
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-none mt-1">
                控制平面 · 平台总控中心
              </p>
            </div>
          </div>

          {/* 核心导航区块 */}
          <div>
            <div className="flex items-center gap-1.5 px-3 mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              <Layers className="size-3 text-slate-400" />
              <span>控制平面核心中枢</span>
            </div>

            <nav className="space-y-1.5">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`group flex items-start gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs shadow-blue-500/30"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span
                      className={`mt-0.5 transition-colors ${
                        isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-slate-700"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <div className="flex flex-col">
                      <span className="leading-tight text-xs font-bold">
                        {item.name}
                      </span>
                      <span
                        className={`text-[11px] font-normal mt-0.5 leading-tight ${
                          isActive ? "text-blue-100" : "text-slate-400"
                        }`}
                      >
                        {item.description}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 底部信息卡片与退出登录 */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          {/* 架构视界说明卡片 */}
          <div className="rounded-xl bg-blue-50/60 p-3 border border-blue-100/80">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700">
              <ShieldCheck className="size-3.5 text-blue-600" />
              <span>Control DB 架构守护</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
              跨租户控制数据库 (saas_control) 直接运维，管理物理库与迁移契约。
            </p>
          </div>

          <button
            type="button"
            disabled={isLoggingOut}
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-150 cursor-pointer disabled:opacity-50"
          >
            {isLoggingOut ? (
              <Loader2 className="size-3.5 animate-spin text-slate-500" />
            ) : (
              <LogOut className="size-3.5 text-slate-400" />
            )}
            <span>{isLoggingOut ? "退出中..." : "退出控制中心"}</span>
          </button>
        </div>
      </aside>

      {/* 右侧主体工作区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部毛玻璃导航条 */}
        <header className="sticky top-0 z-30 h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-slate-400">
              控制平面 (Control Plane)
            </span>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-800">
              {currentNav?.name || "控制台"}
            </span>
          </div>

          {/* 右侧系统与管理员状态指示微徽章 */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              <Cpu className="size-3 text-blue-600" />
              <span>PG 17 集群就绪</span>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1 text-xs font-semibold text-blue-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Control Super Admin</span>
            </div>
          </div>
        </header>

        {/* 页面主内容区域 */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
