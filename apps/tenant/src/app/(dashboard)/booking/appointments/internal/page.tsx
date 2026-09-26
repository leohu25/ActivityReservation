import React from "react";
import { headers } from "next/headers";
import { getCurrentTenantContext } from "@base/auth";
import { listActivitiesQuery } from "@domain/activity-booking/activity-management/server";
import { createInternalAppointmentAction } from "../../actions";
import { Card } from "@base/ui";
import { ArrowLeft, FileCheck2, CalendarClock, UserCheck } from "lucide-react";
import Link from "next/link";

export default async function InternalAppointmentPage() {
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);
  const activities = await listActivitiesQuery(ctx.organizationId);

  // 展开所有活动及其现有场次
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
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/booking/appointments"
          className="size-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">发起校内内部免审预约</h1>
          <p className="text-xs text-muted-foreground">
            面向在校教职工、重大接待、学术交流专线（支持选用已有场次，或现场加开临时场次）
          </p>
        </div>
      </div>

      <Card className="p-6">
        <form action={createInternalAppointmentAction} className="space-y-5">
          {/* 1. 教师身份信息 */}
          <div className="space-y-3 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
            <h2 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <UserCheck className="size-4 text-blue-600" />
              预约教职工信息 (需具备校内教职工身份)
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">预约教师姓名 *</label>
                <input
                  type="text"
                  name="applicantName"
                  required
                  placeholder="如: 张建国 老师"
                  className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">联系手机号 *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="请输入教师手机号"
                  className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">所属学院/行政部门</label>
                <input
                  type="text"
                  name="organization"
                  defaultValue="护理学院"
                  className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">到访实到总人数 *</label>
                <input
                  type="number"
                  name="peopleCount"
                  required
                  min={1}
                  max={200}
                  defaultValue={15}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* 2. 排班模式选择 (业务需求 3: 选用已有场次 vs 现场加开临时场次) */}
          <div className="space-y-3.5">
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <CalendarClock className="size-4 text-primary" />
              场次排班方式 (支持加开临时接待专场)
            </h2>

            {/* 选项 A: 选用已有场次 */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="modeExisting"
                  name="mode"
                  value="EXISTING"
                  defaultChecked
                  className="size-3.5 text-primary"
                />
                <label htmlFor="modeExisting" className="text-xs font-bold text-slate-800">
                  方式一：选用已有常规活动场次
                </label>
              </div>
              <select
                name="sessionSelect"
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

            {/* 选项 B: 现场加开临时场次 */}
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="modeTemporary"
                  name="mode"
                  value="TEMPORARY"
                  className="size-3.5 text-primary"
                />
                <label htmlFor="modeTemporary" className="text-xs font-bold text-indigo-950">
                  方式二：现场为本次接待加开专属临时场次 (自动创建排班并锁票)
                </label>
              </div>

              <div className="space-y-2 pl-5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600">关联活动主题 *</label>
                  <select
                    name="tempActivityId"
                    className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-indigo-200 focus:outline-none focus:border-primary"
                  >
                    {activities.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title} ({a.venue.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600">临时场次日期</label>
                    <input
                      type="date"
                      name="tempDate"
                      defaultValue={new Date().toISOString().slice(0, 10)}
                      className="w-full text-xs px-2.5 py-2 rounded-lg bg-white border border-indigo-200 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600">开始时间</label>
                    <input
                      type="time"
                      name="tempStartTime"
                      defaultValue="15:00"
                      className="w-full text-xs px-2.5 py-2 rounded-lg bg-white border border-indigo-200 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600">结束时间</label>
                    <input
                      type="time"
                      name="tempEndTime"
                      defaultValue="16:30"
                      className="w-full text-xs px-2.5 py-2 rounded-lg bg-white border border-indigo-200 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
            >
              <FileCheck2 className="size-4" />
              立即确认出票
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
