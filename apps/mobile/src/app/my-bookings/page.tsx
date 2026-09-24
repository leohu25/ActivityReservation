import React from "react";
import { Clock, Calendar, CheckCircle2 } from "lucide-react";

export default function MyBookingsPage() {
  const mockBookings = [
    {
      id: "1",
      code: "APPT202609240001",
      activityTitle: "宁卫校史馆沉浸式参观与讲解",
      sessionTime: "2026-09-25 09:30-11:00",
      status: "APPROVED",
      statusLabel: "已通过",
      peopleCount: 1,
    },
  ];

  return (
    <div className="flex-1 flex flex-col p-5">
      <header className="pt-4 pb-4">
        <h1 className="text-xl font-bold tracking-tight">我的预约记录</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          查看个人与团队预约进度及通行状态
        </p>
      </header>

      <div className="space-y-3 mt-2">
        {mockBookings.map((b) => (
          <div
            key={b.id}
            className="p-4 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm line-clamp-1">{b.activityTitle}</span>
              <span className="text-[11px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full shrink-0">
                {b.statusLabel}
              </span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary" />
                <span>{b.sessionTime}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-primary" />
                <span>单号: {b.code} · 共 {b.peopleCount} 人</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
