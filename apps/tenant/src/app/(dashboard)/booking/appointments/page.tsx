import React from "react";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCurrentTenantContext } from "@base/auth";
import {
  listAppointmentsQuery,
  auditAppointmentService,
} from "@domain/activity-booking/appointment-management/server";
import { Card, Badge } from "@base/ui";
import { CheckCircle2, XCircle, Clock, Users, Phone, Search, Users2, User } from "lucide-react";
import Link from "next/link";

interface AppointmentsPageProps {
  searchParams: Promise<{ tab?: string; keyword?: string; status?: string }>;
}

export default async function AppointmentsPage({ searchParams }: AppointmentsPageProps) {
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);
  const { tab = "ALL", keyword, status } = await searchParams;

  let appointments = await listAppointmentsQuery(ctx.organizationId);

  // 1. Tab 分流过滤 (业务需求 2)
  if (tab === "INDIVIDUAL") {
    appointments = appointments.filter((a) => a.type === "INDIVIDUAL");
  } else if (tab === "TEAM") {
    appointments = appointments.filter((a) => a.type === "TEAM");
  } else if (tab === "INTERNAL") {
    appointments = appointments.filter((a) => a.type === "INTERNAL");
  }

  // 2. 关键词与状态过滤
  if (keyword) {
    const kw = keyword.trim().toLowerCase();
    appointments = appointments.filter(
      (a) =>
        a.code.toLowerCase().includes(kw) ||
        a.applicantName.toLowerCase().includes(kw) ||
        a.phone.includes(kw) ||
        (a.team?.teamName && a.team.teamName.toLowerCase().includes(kw)),
    );
  }
  if (status) {
    appointments = appointments.filter((a) => a.status === status);
  }

  // Server Action 审批操作
  async function handleAuditAction(formData: FormData) {
    "use server";
    const appointmentId = formData.get("appointmentId") as string;
    const action = formData.get("action") as "APPROVE" | "REJECT";
    const remark = (formData.get("remark") as string) || undefined;

    const innerHeaders = await headers();
    const innerCtx = await getCurrentTenantContext(innerHeaders);

    await auditAppointmentService(
      innerCtx.organizationId,
      { appointmentId, action, remark },
      "00000000-0000-7000-8000-000000000000",
    );

    revalidatePath("/booking/appointments");
  }

  const tabs = [
    { key: "ALL", label: "全部预约" },
    { key: "INDIVIDUAL", label: "个人预约" },
    { key: "TEAM", label: "团队拼团预约" },
    { key: "INTERNAL", label: "校内免审预约" },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* 顶部标题区 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">预约审核工作台</h1>
          <p className="text-xs text-muted-foreground mt-1">
            审核处理社会公众、在校师生及团队预约申请，区分个人与团队名册并签发入场码
          </p>
        </div>
        <Link
          href="/booking/appointments/internal"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
        >
          <Users2 className="size-4" />
          发起内部免审预约
        </Link>
      </div>

      {/* Tab 分流栏 */}
      <div className="flex border-b border-slate-200 gap-6">
        {tabs.map((t) => {
          const isActive = tab === t.key;
          return (
            <Link
              key={t.key}
              href={`/booking/appointments?tab=${t.key}`}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-all ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* 搜索筛选栏 */}
      <Card className="p-4 bg-slate-50/60 border-slate-200 shadow-xs">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input type="hidden" name="tab" value={tab} />
          <div className="relative sm:col-span-2">
            <Search className="size-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              name="keyword"
              defaultValue={keyword || ""}
              placeholder="搜索预约编号、申请人姓名、手机号或团队名称..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            <select
              name="status"
              defaultValue={status || ""}
              className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-primary"
            >
              <option value="">全部状态</option>
              <option value="PENDING">待审核</option>
              <option value="APPROVED">已通过</option>
              <option value="REJECTED">已驳回</option>
              <option value="CHECKED_IN">已核销入场</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
            >
              筛选
            </button>
            {(keyword || status) && (
              <Link
                href={`/booking/appointments?tab=${tab}`}
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-900 border border-slate-200 bg-white rounded-lg flex items-center justify-center shrink-0"
              >
                重置
              </Link>
            )}
          </div>
        </form>
      </Card>

      {/* 预约单据列表与详情卡片 */}
      <div className="space-y-3.5">
        {appointments.map((appt) => {
          const isTeam = appt.type === "TEAM";
          const isInternal = appt.type === "INTERNAL";

          return (
            <Card key={appt.id} className="p-5 border-slate-200 hover:shadow-xs transition-shadow">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-base text-slate-900">{appt.activity.title}</span>

                    {/* 三级用户身份徽章 (业务需求 7) */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        appt.userType === "TEACHER"
                          ? "bg-blue-100 text-blue-700"
                          : appt.userType === "STUDENT"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {appt.userType === "TEACHER"
                        ? "教师预约"
                        : appt.userType === "STUDENT"
                        ? "学生预约"
                        : "社会公众"}
                    </span>

                    <Badge variant={isTeam ? "secondary" : isInternal ? "default" : "outline"}>
                      {isTeam ? "团队拼团" : isInternal ? "内部免审" : "个人自发"}
                    </Badge>

                    <Badge
                      variant={
                        appt.status === "APPROVED"
                          ? "default"
                          : appt.status === "REJECTED"
                          ? "destructive"
                          : appt.status === "CHECKED_IN"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {appt.status === "APPROVED"
                        ? "已通过"
                        : appt.status === "REJECTED"
                        ? "已驳回"
                        : appt.status === "CHECKED_IN"
                        ? "已核销入场"
                        : "待审核"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="font-mono">单号: {appt.code}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5 text-slate-400" />
                      {appt.session.date} ({appt.session.startTime} ~ {appt.session.endTime})
                    </span>
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <User className="size-3.5 text-primary" />
                      申请人/领队: {appt.applicantName} ({appt.phone})
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="size-3.5 text-slate-400" />
                      实到人数: {appt.peopleCount} 人
                    </span>
                    {appt.organization && <span>所属: {appt.organization}</span>}
                  </div>

                  {/* 团队专属信息展示区 (业务需求 2) */}
                  {isTeam && appt.team && (
                    <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">
                          团队名: {appt.team.teamName} (邀请码:{" "}
                          <span className="font-mono text-primary">{appt.team.inviteCode}</span>)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          拼团进度: {appt.team.joinedCount} / {appt.team.targetCount} 人
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 同行人名册展示 */}
                  {appt.visitors.length > 0 && (
                    <div className="text-xs text-slate-500 pt-1">
                      <span className="font-medium text-slate-700">同行随行人员 ({appt.visitors.length}人): </span>
                      {appt.visitors.map((v, idx) => (
                        <span key={v.id} className="inline-block mr-3">
                          {idx + 1}. {v.name} {v.phone ? `(${v.phone})` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 操作栏 */}
                <div className="flex sm:flex-col items-end gap-2 shrink-0">
                  {appt.status === "PENDING" && (
                    <div className="flex items-center gap-2">
                      <form action={handleAuditAction}>
                        <input type="hidden" name="appointmentId" value={appt.id} />
                        <input type="hidden" name="action" value="APPROVE" />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="size-3.5" />
                          通过并签发
                        </button>
                      </form>
                      <form action={handleAuditAction}>
                        <input type="hidden" name="appointmentId" value={appt.id} />
                        <input type="hidden" name="action" value="REJECT" />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          <XCircle className="size-3.5" />
                          驳回
                        </button>
                      </form>
                    </div>
                  )}

                  {appt.status === "APPROVED" && (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="size-3.5" />
                      已签发通行凭证
                    </span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {appointments.length === 0 && (
          <div className="rounded-2xl border border-dashed p-16 text-center text-muted-foreground bg-slate-50/50">
            当前分类下暂无预约记录
          </div>
        )}
      </div>
    </div>
  );
}
