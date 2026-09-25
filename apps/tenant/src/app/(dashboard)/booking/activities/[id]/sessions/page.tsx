import React from "react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentTenantContext } from "@base/auth";
import { getActivityDetailQuery } from "@domain/activity-booking/activity-management/server";
import { createSessionAction } from "./actions";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@base/ui";
import { MasterDataStatus } from "@base/shared";
import { ArrowLeft, Clock, Plus, Users } from "lucide-react";
import Link from "next/link";

interface SessionsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ActivitySessionsPage({ params }: SessionsPageProps) {
  const { id } = await params;
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);
  const activity = await getActivityDetailQuery(ctx.organizationId, id);

  if (!activity) notFound();

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/booking/activities"
          className="size-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">场次排班与容量管理</h1>
          <p className="text-xs text-muted-foreground">当前活动: {activity.title}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* 左侧：新增场次表单 */}
        <Card className="p-5 md:col-span-1 h-fit">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Plus className="size-4 text-primary" />
              添加新排班场次
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <form action={createSessionAction} className="space-y-3.5">
              <input type="hidden" name="activityId" value={activity.id} />

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">场次日期 *</label>
                <input
                  type="date"
                  name="date"
                  required
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">开始时间 *</label>
                  <input
                    type="time"
                    name="startTime"
                    required
                    defaultValue="09:30"
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">结束时间 *</label>
                  <input
                    type="time"
                    name="endTime"
                    required
                    defaultValue="11:00"
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">总容纳人数上限 *</label>
                <input
                  type="number"
                  name="totalCapacity"
                  required
                  min={1}
                  max={500}
                  defaultValue={30}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-primary text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-primary/90 transition-colors"
              >
                保存新场次
              </button>
            </form>
          </CardContent>
        </Card>

        {/* 右侧：已有场次列表 */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold">已排班场次 ({activity.sessions.length})</h2>
          </div>

          {activity.sessions.map((sess) => (
            <Card key={sess.id} className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{sess.date}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" />
                    {sess.startTime} ~ {sess.endTime}
                  </span>
                  <Badge variant={sess.status === MasterDataStatus.ACTIVE ? "default" : "secondary"}>
                    {sess.status === MasterDataStatus.ACTIVE ? "可预约" : sess.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="size-3 text-primary" />
                  已预约 {sess.bookedCount} 人 / 上限 {sess.totalCapacity} 人 (余{" "}
                  {sess.totalCapacity - sess.bookedCount} 人)
                </p>
              </div>
            </Card>
          ))}

          {activity.sessions.length === 0 && (
            <div className="p-10 border border-dashed rounded-xl text-center text-xs text-muted-foreground">
              当前活动暂无场次排班，请在左侧添加
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
