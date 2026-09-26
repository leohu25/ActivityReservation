import React from "react";
import { headers } from "next/headers";
import { getCurrentTenantContext } from "@base/auth";
import { listAppointmentsQuery } from "@domain/activity-booking/appointment-management/server";
import { listCampusSyncRecordsQuery } from "@domain/activity-booking/campus-sync/server";
import { checkinByCodeAction } from "./actions";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@base/ui";
import { QrCode, ShieldCheck, Search, CheckCircle2, User, Users, Clock, Scan } from "lucide-react";
import Link from "next/link";

interface QrcodePageProps {
  searchParams: Promise<{ tab?: string; keyword?: string }>;
}

export default async function QrcodesManagePage({ searchParams }: QrcodePageProps) {
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);
  const { tab = "VISITOR", keyword } = await searchParams;

  const [appointments, syncRecords] = await Promise.all([
    listAppointmentsQuery(ctx.organizationId),
    listCampusSyncRecordsQuery(ctx.organizationId),
  ]);

  // 1. 访客/公众通行码记录 (仅已通过审核的记录具备通行码)
  let visitorCodes = appointments.filter((a) => a.status === "APPROVED" || a.status === "CHECKED_IN");
  if (keyword) {
    const kw = keyword.trim().toLowerCase();
    visitorCodes = visitorCodes.filter(
      (a) => a.code.toLowerCase().includes(kw) || a.applicantName.toLowerCase().includes(kw) || a.phone.includes(kw),
    );
  }

  // 2. 师生校内码记录
  const staffRecords = syncRecords.filter((r) => r.type === "TEACHER");
  const studentRecords = syncRecords.filter((r) => r.type === "STUDENT");

  return (
    <div className="space-y-6 p-6">
      {/* 顶部标题区 (业务需求 8: 独立运维模块) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <QrCode className="size-6 text-primary" />
            通行码与现场核销 (运维专属中心)
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            独立开放给现场检票员、安保人员及二维码运维人员，负责访客通行码现场核销与校内身份码管理
          </p>
        </div>

        {/* 现场快速核销扫码窗口 */}
        <form action={checkinByCodeAction} className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
          <input
            type="text"
            name="code"
            required
            placeholder="输入预约单号或通行字串..."
            className="text-xs px-3 py-1.5 focus:outline-none w-52"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <Scan className="size-3.5" />
            现场核销入场
          </button>
        </form>
      </div>

      {/* Tab 分类 */}
      <div className="flex border-b border-slate-200 gap-6">
        <Link
          href="/booking/qrcodes?tab=VISITOR"
          className={`pb-2.5 text-xs font-semibold border-b-2 transition-all ${
            tab === "VISITOR"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          访客预约通行码 ({visitorCodes.length})
        </Link>
        <Link
          href="/booking/qrcodes?tab=STAFF"
          className={`pb-2.5 text-xs font-semibold border-b-2 transition-all ${
            tab === "STAFF"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          教职工通行卡 ({staffRecords.length})
        </Link>
        <Link
          href="/booking/qrcodes?tab=STUDENT"
          className={`pb-2.5 text-xs font-semibold border-b-2 transition-all ${
            tab === "STUDENT"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          学生电子校园码 ({studentRecords.length})
        </Link>
      </div>

      {/* 访客码列表 */}
      {tab === "VISITOR" && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50/80 text-left text-xs font-semibold text-slate-500">
                  <th className="p-3.5">通行码状态</th>
                  <th className="p-3.5">预约单号</th>
                  <th className="p-3.5">申请人 / 访客</th>
                  <th className="p-3.5">联系电话</th>
                  <th className="p-3.5">适用活动与场次</th>
                  <th className="p-3.5">实到人数</th>
                  <th className="p-3.5">通行凭证签名</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visitorCodes.map((appt) => (
                  <tr key={appt.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="p-3.5">
                      {appt.status === "CHECKED_IN" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="size-3 text-slate-500" />
                          已核销入场
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full">
                          <ShieldCheck className="size-3 text-green-600" />
                          有效待通行
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-xs font-medium text-slate-800">{appt.code}</td>
                    <td className="p-3.5 font-bold text-slate-900">{appt.applicantName}</td>
                    <td className="p-3.5 text-muted-foreground">{appt.phone}</td>
                    <td className="p-3.5 text-xs text-slate-600">
                      <div>{appt.activity.title}</div>
                      <div className="text-slate-400 text-[11px]">
                        {appt.session.date} ({appt.session.startTime}~{appt.session.endTime})
                      </div>
                    </td>
                    <td className="p-3.5 font-medium">{appt.peopleCount} 人</td>
                    <td className="p-3.5 font-mono text-[10px] text-slate-400 truncate max-w-[150px]">
                      {appt.qrCodeSign || "已签发"}
                    </td>
                  </tr>
                ))}

                {visitorCodes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-16 text-center text-muted-foreground">
                      暂无有效通行的访客二维码
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 教职工码列表 */}
      {tab === "STAFF" && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {staffRecords.map((s) => (
            <Card key={s.id} className="p-4 flex items-center justify-between border-slate-200">
              <div className="space-y-1">
                <div className="font-bold text-sm text-slate-900">{s.name} (教师)</div>
                <div className="text-xs text-muted-foreground font-mono">工号: {s.userCode}</div>
                <div className="text-xs text-slate-500">{s.department || "基础教学部"}</div>
              </div>
              <div className="size-12 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center text-blue-700">
                <QrCode className="size-7" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 学生码列表 */}
      {tab === "STUDENT" && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {studentRecords.map((s) => (
            <Card key={s.id} className="p-4 flex items-center justify-between border-slate-200">
              <div className="space-y-1">
                <div className="font-bold text-sm text-slate-900">{s.name} (学生)</div>
                <div className="text-xs text-muted-foreground font-mono">学号: {s.userCode}</div>
                <div className="text-xs text-slate-500">{s.className || "护理班级"}</div>
              </div>
              <div className="size-12 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center text-emerald-700">
                <QrCode className="size-7" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
