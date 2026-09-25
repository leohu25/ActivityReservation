import React from "react";
import { getTenantDbManager } from "@base/db-tenant";
import { getServerAuthRuntime } from "@base/auth";
import Link from "next/link";
import { Calendar, Users, MapPin, ChevronRight, Sparkles, Building, Newspaper, ArrowRight } from "lucide-react";

export default async function MobileHomePage() {
  const runtime = getServerAuthRuntime();
  let orgId = "01a0d2ea-1691-7508-8ad3-bbd232a45b72";
  try {
    const org = await runtime.prisma.organization.findFirst({ select: { id: true } });
    if (org?.id) orgId = org.id;
  } catch {}

  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient(orgId);

  const [activities, banners, newsList] = await Promise.all([
    prisma.activity.findMany({
      where: { isDeleted: false, status: "PUBLISHED" },
      orderBy: { sortOrder: "desc" },
      include: {
        venue: true,
        sessions: { where: { isDeleted: false } },
      },
    }),
    prisma.banner.findMany({
      where: { isDeleted: false, status: "ACTIVE" },
      orderBy: { sortOrder: "desc" },
      take: 3,
    }),
    prisma.news.findMany({
      where: { isDeleted: false, status: "PUBLISHED" },
      orderBy: [{ isTop: "desc" }, { createdAt: "desc" }],
      take: 2,
    }),
  ]);

  return (
    <div className="flex-1 flex flex-col">
      {/* 顶部 Brand Header */}
      <header className="px-5 pt-8 pb-4 bg-gradient-to-b from-blue-50/80 to-transparent">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-white font-bold text-xs shadow-sm">
            NW
          </span>
          <span className="font-bold text-lg tracking-tight">宁卫活动预约</span>
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            <Sparkles className="size-3" />
            官方通道
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          宁波卫生职业技术学院场馆活动与参观预约平台
        </p>
      </header>

      {/* 顶部精美轮播/展位 Banner 卡片 */}
      {banners.length > 0 && (
        <div className="px-4 mb-4">
          <div className="relative overflow-hidden rounded-2xl aspect-[21/9] bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 flex flex-col justify-end shadow-md">
            <span className="text-[10px] font-semibold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full w-fit mb-1">
              场馆聚焦
            </span>
            <h2 className="text-base font-bold line-clamp-1">{banners[0].title}</h2>
          </div>
        </div>
      )}

      {/* 场馆动态资讯速递 */}
      {newsList.length > 0 && (
        <div className="px-4 mb-5">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/80 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden pr-2">
              <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded shrink-0">
                公告
              </span>
              <span className="text-xs text-slate-700 font-medium truncate">
                {newsList[0].title}
              </span>
            </div>
            <Newspaper className="size-4 shrink-0 text-slate-400" />
          </div>
        </div>
      )}

      {/* 预约活动卡片流 */}
      <div className="px-4 space-y-3.5 pb-6 flex-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-bold text-sm text-slate-900">开放预约活动</h2>
          <span className="text-xs text-muted-foreground">共 {activities.length} 项</span>
        </div>

        {activities.map((act) => (
          <Link
            key={act.id}
            href={`/activity/${act.id}`}
            className="block p-4 rounded-3xl bg-white border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] hover:shadow-md transition-all active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-base leading-snug line-clamp-1">
                {act.title}
              </h3>
              <ChevronRight className="size-4 shrink-0 text-slate-400 mt-0.5" />
            </div>

            <div className="mt-2.5 space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0 text-primary" />
                <span className="truncate">{act.venue.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5 shrink-0 text-primary" />
                <span>
                  {new Date(act.startDate).toLocaleDateString()} ~ {new Date(act.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="size-3.5 shrink-0 text-primary" />
                <span>
                  可选场次: {act.sessions.length} 场 · {act.allowTeam ? "支持个人/团体拼团" : "仅限个人预约"}
                </span>
              </div>
            </div>
          </Link>
        ))}

        {activities.length === 0 && (
          <div className="py-16 text-center text-xs text-muted-foreground rounded-2xl border border-dashed border-slate-200">
            暂无开放的预约活动，请留意最新通知
          </div>
        )}
      </div>
    </div>
  );
}
