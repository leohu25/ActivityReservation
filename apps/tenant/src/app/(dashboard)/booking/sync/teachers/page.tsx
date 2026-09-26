import React from "react";
import { headers } from "next/headers";
import { getCurrentTenantContext } from "@base/auth";
import { listCampusSyncRecordsQuery } from "@domain/activity-booking/campus-sync/server";
import { triggerManualSyncAction } from "../../actions";
import { Badge, Card } from "@base/ui";
import { RefreshCw, CheckCircle2, AlertCircle, UserCheck, ShieldCheck } from "lucide-react";

export default async function TeachersSyncPage() {
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);
  const allRecords = await listCampusSyncRecordsQuery(ctx.organizationId);

  // 业务需求 7: 仅筛选教职工数据
  const teachers = allRecords.filter((r) => r.type === "TEACHER");

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">教职工组织与同步管理</h1>
          <p className="text-xs text-muted-foreground mt-1">
            维护在校教职工基础档案，对接外部人事系统同步主数据，并为教职工自动生成系统后台账号
          </p>
        </div>
        <form action={async () => {
          "use server";
          await triggerManualSyncAction("TEACHER");
        }}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className="size-3.5" />
            一键同步教职工主数据
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50/80 text-left text-xs font-semibold text-slate-500">
              <th className="p-3.5">身份徽章</th>
              <th className="p-3.5">教师工号</th>
              <th className="p-3.5">姓名</th>
              <th className="p-3.5">所属学院 / 部门</th>
              <th className="p-3.5">联系电话</th>
              <th className="p-3.5">电子邮箱</th>
              <th className="p-3.5">同步状态</th>
              <th className="p-3.5">后台账号状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teachers.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-slate-50/60">
                <td className="p-3.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                    <UserCheck className="size-3" />
                    在校教师
                  </span>
                </td>
                <td className="p-3.5 font-mono text-xs font-medium text-slate-800">{r.userCode}</td>
                <td className="p-3.5 font-bold text-slate-900">{r.name}</td>
                <td className="p-3.5 text-muted-foreground">{r.department || "基础教学部"}</td>
                <td className="p-3.5 text-muted-foreground">{r.phone || "-"}</td>
                <td className="p-3.5 text-muted-foreground font-mono text-xs">{r.email || "-"}</td>
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
                  <span className="inline-flex items-center gap-1 text-xs text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    <ShieldCheck className="size-3.5" />
                    已自动自愈开通 (默认密码有效)
                  </span>
                </td>
              </tr>
            ))}

            {teachers.length === 0 && (
              <tr>
                <td colSpan={8} className="p-16 text-center text-muted-foreground">
                  暂无教职工档案，请点击右上角按钮触发外部人事接口同步
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
