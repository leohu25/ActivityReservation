import React from "react";
import { headers } from "next/headers";
import { getCurrentTenantContext } from "@base/auth";
import { listCampusSyncRecordsQuery } from "@domain/activity-booking/campus-sync/server";
import { triggerManualSyncAction } from "../../actions";
import { Badge } from "@base/ui";
import { RefreshCw, CheckCircle2, AlertCircle, GraduationCap } from "lucide-react";

export default async function StudentsSyncPage() {
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);
  const allRecords = await listCampusSyncRecordsQuery(ctx.organizationId);

  // 业务需求 7: 仅筛选学生数据
  const students = allRecords.filter((r) => r.type === "STUDENT");

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">学生档案与同步管理</h1>
          <p className="text-xs text-muted-foreground mt-1">
            维护在籍学生信息，对接教务学籍系统同步班级架构，支撑学生专属活动预约及志愿者报名
          </p>
        </div>
        <form action={async () => {
          "use server";
          await triggerManualSyncAction("STUDENT");
        }}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className="size-3.5" />
            一键同步学生学籍数据
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50/80 text-left text-xs font-semibold text-slate-500">
              <th className="p-3.5">身份徽章</th>
              <th className="p-3.5">学号</th>
              <th className="p-3.5">姓名</th>
              <th className="p-3.5">所属学院 / 专业班级</th>
              <th className="p-3.5">联系电话</th>
              <th className="p-3.5">同步状态</th>
              <th className="p-3.5">预约服务权限</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-slate-50/60">
                <td className="p-3.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    <GraduationCap className="size-3" />
                    在籍学生
                  </span>
                </td>
                <td className="p-3.5 font-mono text-xs font-medium text-slate-800">{r.userCode}</td>
                <td className="p-3.5 font-bold text-slate-900">{r.name}</td>
                <td className="p-3.5 text-muted-foreground">{r.className || r.department || "护理专业班"}</td>
                <td className="p-3.5 text-muted-foreground">{r.phone || "-"}</td>
                <td className="p-3.5">
                  {r.syncStatus === "SYNCED" ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle2 className="size-3.5" />
                      已同步
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-destructive font-medium">
                      <AlertCircle className="size-3.5" />
                      {r.syncStatus}
                    </span>
                  )}
                </td>
                <td className="p-3.5">
                  <span className="text-xs text-slate-500 font-medium">
                    可申请志愿者 / 班级拼团预约
                  </span>
                </td>
              </tr>
            ))}

            {students.length === 0 && (
              <tr>
                <td colSpan={7} className="p-16 text-center text-muted-foreground">
                  暂无学生档案，请点击右上角按钮触发教务学籍接口同步
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
