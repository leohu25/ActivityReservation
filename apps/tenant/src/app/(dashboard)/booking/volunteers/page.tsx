import React from "react";
import { headers } from "next/headers";
import { getCurrentTenantContext } from "@base/auth";
import { listVolunteersQuery } from "@domain/activity-booking/volunteer-management/server";
import { auditVolunteerAction } from "../actions";
import { Card, Badge } from "@base/ui";
import { HeartHandshake, CheckCircle2, XCircle, Phone, BookOpen } from "lucide-react";

export default async function VolunteersPage() {
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);
  const volunteers = await listVolunteersQuery(ctx.organizationId);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">志愿者申请审核</h1>
        <p className="text-sm text-muted-foreground">
          审核学生与社会志愿者讲解员招募申请，分派场馆志愿服务岗位
        </p>
      </div>

      <div className="space-y-3">
        {volunteers.map((vol) => (
          <Card key={vol.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base">{vol.name}</span>
                <Badge variant={vol.status === "APPROVED" ? "default" : vol.status === "REJECTED" ? "destructive" : "secondary"}>
                  {vol.status === "APPROVED" ? "已录用" : vol.status === "REJECTED" ? "未录用" : "待审核"}
                </Badge>
                {vol.serviceRole && <span className="text-xs text-muted-foreground">岗位: {vol.serviceRole}</span>}
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Phone className="size-3.5" />
                  {vol.phone}
                </span>
                {vol.studentNo && <span>学号: {vol.studentNo}</span>}
                {vol.major && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="size-3.5" />
                    专业: {vol.major}
                  </span>
                )}
                <span>意向活动: {vol.activity.title}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {vol.status === "PENDING" && (
                <>
                  <form action={auditVolunteerAction}>
                    <input type="hidden" name="applicationId" value={vol.id} />
                    <input type="hidden" name="action" value="APPROVE" />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="size-3.5" />
                      录用
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
                </>
              )}
            </div>
          </Card>
        ))}

        {volunteers.length === 0 && (
          <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            暂无待处理的志愿者申请
          </div>
        )}
      </div>
    </div>
  );
}
