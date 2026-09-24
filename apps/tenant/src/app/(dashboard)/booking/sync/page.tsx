import React from "react";
import { headers } from "next/headers";
import { getCurrentTenantContext } from "@base/auth";
import { listCampusSyncRecordsQuery } from "@domain/activity-booking/campus-sync/server";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@base/ui";
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
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="size-3.5" />
          立即触发增量同步
        </button>
      </div>

      <div className="rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs font-medium text-muted-foreground">
              <th className="p-3">类型</th>
              <th className="p-3">工号/学号</th>
              <th className="p-3">姓名</th>
              <th className="p-3">院系/部门</th>
              <th className="p-3">手机号</th>
              <th className="p-3">同步状态</th>
              <th className="p-3">关联用户</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b transition-colors hover:bg-muted/50">
                <td className="p-3">
                  <Badge variant={r.type === "TEACHER" ? "default" : "secondary"}>
                    {r.type === "TEACHER" ? "教职工" : "学生"}
                  </Badge>
                </td>
                <td className="p-3 font-mono text-xs">{r.userCode}</td>
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3 text-muted-foreground">{r.department || r.className || "-"}</td>
                <td className="p-3 text-muted-foreground">{r.phone || "-"}</td>
                <td className="p-3">
                  {r.syncStatus === "SYNCED" ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 className="size-3.5" />
                      已同步
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="size-3.5" />
                      {r.syncStatus}
                    </span>
                  )}
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {r.boundUserId ? "已自动生成账号" : "无需绑定"}
                </td>
              </tr>
            ))}

            {records.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  暂无同步记录，外部系统调用预留 Webhook 后将自动在此展示
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
