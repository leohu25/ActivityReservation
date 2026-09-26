import React from "react";
import { headers } from "next/headers";
import { getCurrentTenantContext } from "@base/auth";
import { listVolunteersQuery } from "@domain/activity-booking/volunteer-management/server";
import { listActivitiesQuery } from "@domain/activity-booking/activity-management/server";
import { auditVolunteerAction } from "../actions";
import { Card, Badge } from "@base/ui";
import { HeartHandshake, CheckCircle2, XCircle, Phone, BookOpen, Search, User } from "lucide-react";
import Link from "next/link";

interface VolunteersPageProps {
  searchParams: Promise<{ activityId?: string; keyword?: string; status?: string }>;
}

export default async function VolunteersPage({ searchParams }: VolunteersPageProps) {
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);
  const { activityId, keyword, status } = await searchParams;

  const [allVolunteers, allActivities] = await Promise.all([
    listVolunteersQuery(ctx.organizationId),
    listActivitiesQuery(ctx.organizationId),
  ]);

  // 业务需求 4: 仅列出真正开启了志愿者招募的活动
  const volunteerActivities = allActivities.filter((a) => a.needVolunteer || a.type === "VOLUNTEER");

  let volunteers = allVolunteers;

  if (activityId) {
    volunteers = volunteers.filter((v) => v.activityId === activityId);
  }
  if (keyword) {
    const kw = keyword.trim().toLowerCase();
    volunteers = volunteers.filter(
      (v) =>
        v.name.toLowerCase().includes(kw) ||
        v.phone.includes(kw) ||
        (v.studentNo && v.studentNo.toLowerCase().includes(kw)),
    );
  }
  if (status) {
    volunteers = volunteers.filter((v) => v.status === status);
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">志愿者申请审核</h1>
          <p className="text-xs text-muted-foreground mt-1">
            审核来自需要招募志愿者活动的申请名册，支持现场审核录取并按需调换服务岗位
          </p>
        </div>
      </div>

      {/* 条件筛选栏 */}
      <Card className="p-4 bg-slate-50/60 border-slate-200 shadow-xs">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="size-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              name="keyword"
              defaultValue={keyword || ""}
              placeholder="搜索志愿者姓名、联系电话或学号..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <select
              name="activityId"
              defaultValue={activityId || ""}
              className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-primary"
            >
              <option value="">全部招募活动</option>
              {volunteerActivities.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <select
              name="status"
              defaultValue={status || ""}
              className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-primary"
            >
              <option value="">全部状态</option>
              <option value="PENDING">待审核</option>
              <option value="APPROVED">已录用</option>
              <option value="REJECTED">已谢绝</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
            >
              筛选
            </button>
            {(activityId || keyword || status) && (
              <Link
                href="/booking/volunteers"
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-900 border border-slate-200 bg-white rounded-lg flex items-center justify-center shrink-0"
              >
                重置
              </Link>
            )}
          </div>
        </form>
      </Card>

      {/* 志愿者申请名单列表 */}
      <div className="space-y-3.5">
        {volunteers.map((vol) => {
          const isPending = vol.status === "PENDING";
          const isApproved = vol.status === "APPROVED";

          return (
            <Card key={vol.id} className="p-5 border-slate-200 hover:shadow-xs transition-shadow">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-slate-900">{vol.name}</span>
                    <Badge variant={isApproved ? "default" : vol.status === "REJECTED" ? "destructive" : "secondary"}>
                      {isApproved ? "已录用" : vol.status === "REJECTED" ? "已谢绝" : "待审核"}
                    </Badge>
                    <span className="text-xs text-rose-700 font-medium bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                      申报岗位: {vol.serviceRole || "展厅讲解"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Phone className="size-3.5 text-primary" />
                      {vol.phone}
                    </span>
                    {vol.studentNo && (
                      <span className="flex items-center gap-1">
                        <User className="size-3.5 text-slate-400" />
                        学号: {vol.studentNo}
                      </span>
                    )}
                    {vol.major && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="size-3.5 text-slate-400" />
                        学院/专业: {vol.major}
                      </span>
                    )}
                    <span className="text-slate-500">
                      意向活动: <strong className="text-slate-700">{vol.activity.title}</strong>
                    </span>
                  </div>

                  {vol.auditRemark && (
                    <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      审核说明: {vol.auditRemark}
                    </p>
                  )}
                </div>

                {/* 审批与服务项目调配操作栏 */}
                <div className="shrink-0 flex items-center gap-2">
                  {isPending && (
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                      <form action={auditVolunteerAction} className="flex items-center gap-2">
                        <input type="hidden" name="applicationId" value={vol.id} />
                        <input type="hidden" name="action" value="APPROVE" />
                        <select
                          name="serviceRole"
                          defaultValue={vol.serviceRole || "展厅义务讲解员"}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                        >
                          <option value="展厅义务讲解员">分派: 展厅义务讲解员</option>
                          <option value="参观动线引导员">分派: 参观动线引导员</option>
                          <option value="急救技能演示助理">分派: 急救技能演示助理</option>
                          <option value="场务签到保障">分派: 场务签到保障</option>
                        </select>
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="size-3.5" />
                          录取分派
                        </button>
                      </form>

                      <form action={auditVolunteerAction}>
                        <input type="hidden" name="applicationId" value={vol.id} />
                        <input type="hidden" name="action" value="REJECT" />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          <XCircle className="size-3.5" />
                          谢绝
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {volunteers.length === 0 && (
          <div className="rounded-2xl border border-dashed p-16 text-center text-muted-foreground bg-slate-50/50">
            暂无待处理的志愿者申请
          </div>
        )}
      </div>
    </div>
  );
}
