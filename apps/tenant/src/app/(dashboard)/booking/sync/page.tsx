import React from "react";
import { headers } from "next/headers";
import { getCurrentTenantContext } from "@base/auth";
import { listCampusSyncRecordsQuery } from "@domain/activity-booking/campus-sync/server";
import { triggerManualSyncAction } from "../actions";
import { Badge } from "@base/ui";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

export default async function CampusSyncPage() {
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);
  const records = await listCampusSyncRecordsQuery(ctx.organizationId);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">校园组织与主数据同步</h1>
          <p className="text-sm text-muted-foreground">
            查看教职工工号、学生学号主数据同步状态及后台用户自动自愈创建结果
          </p>
        </div>
        <form action={triggerManualSyncAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className="size-3.5" />
            立即触发增量同步
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50/80 text-left text-xs font-semibold text-slate-500">
              <th className="p-3.5">类型</th>
              <th className="p-3.5">工号/学号</th>
              <th className="p-3.5">姓名</th>
              <th className="p-3.5">院系/部门</th>
              <th className="p-3.5">手机号</th>
              <th className="p-3.5">同步状态</th>
              <th className="p-3.5">关联账号状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-slate-50/60">
                <td className="p-3.5">
                  <Badge variant={r.type === "TEACHER" ? "default" : "secondary"}>
                    {r.type === "TEACHER" ? "教职工" : "学生"}
                  </Badge>
                </td>
                <td className="p-3.5 font-mono text-xs">{r.userCode}</td>
                <td className="p-3.5 font-medium">{r.name}</td>
                <td className="p-3.5 text-muted-foreground">{r.department || r.className || "-"}</td>
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
                <td className="p-3.5 text-xs text-slate-500">
                  {r.boundUserId ? (
                    <span className="text-primary font-medium">已自动自愈生成账号</span>
                  ) : (
                    "无需绑定"
                  )}
                </td>
              </tr>
            ))}

            {records.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-muted-foreground">
                  暂无同步记录，点击右上角按钮可立即模拟执行一次增量同步
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
