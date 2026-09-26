import React from "react";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCurrentTenantContext } from "@base/auth";
import {
  listAppointmentsQuery,
  auditAppointmentService,
} from "@domain/activity-booking/appointment-management/server";
import { Card } from "@base/ui";
import { Search, Users2 } from "lucide-react";
import Link from "next/link";
import { AppointmentListView } from "./_components/appointment-list-view";

interface AppointmentsPageProps {
  searchParams: Promise<{ tab?: string; keyword?: string; status?: string }>;
}

export default async function AppointmentsPage({ searchParams }: AppointmentsPageProps) {
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);
  const { tab = "ALL", keyword, status } = await searchParams;

  let appointments = await listAppointmentsQuery(ctx.organizationId);

  // 1. Tab 分流过滤
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
            审核处理社会公众、在校师生及团队预约申请，区分个人与团队名册并签发入场码（支持点击卡片查看完整详情）
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

      {/* 预约单据列表与详情模态抽屉 */}
      <AppointmentListView
        appointments={appointments as any}
        auditAction={handleAuditAction}
      />
    </div>
  );
}
