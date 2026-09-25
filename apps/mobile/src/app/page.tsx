import React from "react";
import { getTenantDbManager } from "@base/db-tenant";
import { getServerAuthRuntime } from "@base/auth";
import Link from "next/link";
import { Calendar, Users, MapPin, ChevronRight, Sparkles } from "lucide-react";

export default async function MobileHomePage() {
  const runtime = getServerAuthRuntime();
  // 动态解析或使用当前宁卫租户组织
  let orgId = "01a0d2ea-1691-7508-8ad3-bbd232a45b72";
  try {
    const org = await runtime.prisma.organization.findFirst({
      select: { id: true },
    });
    if (org?.id) {
      orgId = org.id;
    }
  } catch {
    // 降级使用兜底
  }

  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient(orgId);

  const activities = await prisma.activity.findMany({
    where: { isDeleted: false, status: "PUBLISHED" },
    orderBy: { sortOrder: "desc" },
    include: {
      venue: true,
      sessions: { where: { isDeleted: false } },
    },
  });

  return (
    <div className="flex-1 flex flex-col">
      {/* 顶部 Brand Header */}
      <header className="px-5 pt-8 pb-5 bg-gradient-to-b from-blue-50/80 to-transparent">
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
        <p className="mt-2 text-xs text-muted-foreground">
          欢迎预约宁波卫生职业技术学院场馆活动与展厅导览
        </p>
      </header>

      {/* 活动卡片流 */}
      <div className="px-4 space-y-3.5 pb-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-semibold text-sm">热门开放活动</h2>
          <span className="text-xs text-muted-foreground">共 {activities.length} 项</span>
        </div>

        {activities.map((act) => (
          <Link
            key={act.id}
            href={`/activity/${act.id}`}
            className="block p-4 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-md transition-all active:scale-[0.99]"
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
                  可选场次: {act.sessions.length} 场 · {act.allowTeam ? "支持个人/团体" : "仅限个人"}
                </span>
              </div>
            </div>
          </Link>
        ))}

        {activities.length === 0 && (
          <div className="py-16 text-center text-xs text-muted-foreground rounded-2xl border border-dashed border-slate-200">
            暂无开放的预约活动，请留意场馆最新通知
          </div>
        )}
      </div>
    </div>
  );
}
