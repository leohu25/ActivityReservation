import React from "react";
import { headers } from "next/headers";
import { getCurrentTenantContext } from "@base/auth";
import { listActivitiesQuery } from "@domain/activity-booking/activity-management/server";
import { createInternalAppointmentAction } from "../../actions";
import { Card } from "@base/ui";
import { ArrowLeft, FileCheck2 } from "lucide-react";
import Link from "next/link";

export default async function InternalAppointmentPage() {
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);
  const activities = await listActivitiesQuery(ctx.organizationId);

  // 展开所有可用场次供管理员直接指派
  const allSessions = activities.flatMap((act) =>
    act.sessions.map((s) => ({
      activityId: act.id,
      activityTitle: act.title,
      sessionId: s.id,
      sessionDate: s.date,
      sessionTime: `${s.startTime}~${s.endTime}`,
      remain: s.totalCapacity - s.bookedCount,
    })),
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/booking/appointments"
          className="size-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">发起内部免审预约</h1>
          <p className="text-xs text-muted-foreground">
            用于学校重大接待、各学院集体参观、专家来校等校内专线预约登记（直接通过，自动锁名额）
          </p>
        </div>
      </div>

      <Card className="p-6">
        <form action={createInternalAppointmentAction} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">选择目标活动与场次 *</label>
            <select
              name="sessionSelect"
              required
              className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-primary"
            >
              {allSessions.map((s) => (
                <option
                  key={s.sessionId}
                  value={`${s.activityId}|${s.sessionId}`}
                  disabled={s.remain <= 0}
                >
                  {s.activityTitle} - {s.sessionDate} ({s.sessionTime}) [余 {s.remain} 人]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">接待/对接人姓名 *</label>
              <input
                type="text"
                name="applicantName"
                required
                placeholder="如: 教务处 王老师"
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">联系电话 *</label>
              <input
                type="tel"
                name="phone"
                required
                placeholder="请输入手机号"
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">接待单位/部门名称</label>
              <input
                type="text"
                name="organization"
                defaultValue="校内教职工专线"
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">来访实到人数 *</label>
              <input
                type="number"
                name="peopleCount"
                required
                min={1}
                max={200}
                defaultValue={10}
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="pt-3 border-t flex justify-end gap-2.5">
            <Link
              href="/booking/appointments"
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              取消
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
            >
              <FileCheck2 className="size-4" />
              立即登记并出票
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
