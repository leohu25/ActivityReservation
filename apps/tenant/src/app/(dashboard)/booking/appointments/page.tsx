import React from "react";
import { headers } from "next/headers";
import { getCurrentTenantContext } from "@base/auth";
import { listAppointmentsQuery } from "@domain/activity-booking/appointment-management/server";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@base/ui";
import { CheckCircle2, XCircle, Clock, Users, Phone } from "lucide-react";

export default async function AppointmentsPage() {
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);
  const appointments = await listAppointmentsQuery(ctx.organizationId);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">预约审核工作台</h1>
        <p className="text-sm text-muted-foreground">
          审核处理公众个人预约、团队预约以及校内免审预约单
        </p>
      </div>

      <div className="space-y-3">
        {appointments.map((appt) => (
          <Card key={appt.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base">{appt.activity.title}</span>
                <Badge variant={appt.type === "TEAM" ? "secondary" : "outline"}>
                  {appt.type === "TEAM" ? "团队预约" : "个人预约"}
                </Badge>
                <Badge
                  variant={
                    appt.status === "APPROVED"
                      ? "default"
                      : appt.status === "REJECTED"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {appt.status === "APPROVED"
                    ? "已通过"
                    : appt.status === "REJECTED"
                    ? "已驳回"
                    : "待审核"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>单号: {appt.code}</span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {appt.session.date} {appt.session.startTime}-{appt.session.endTime}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" />
                  申请人: {appt.applicantName} ({appt.peopleCount}人)
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="size-3.5" />
                  {appt.phone}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {appt.status === "PENDING" && (
                <>
                  <form action={`/api/appointments/${appt.id}/approve`} method="POST">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <CheckCircle2 className="size-3.5" />
                      审核通过
                    </button>
                  </form>
                  <form action={`/api/appointments/${appt.id}/reject`} method="POST">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-input bg-background hover:bg-muted text-destructive transition-colors"
                    >
                      <XCircle className="size-3.5" />
                      驳回
                    </button>
                  </form>
                </>
              )}
            </div>
          </Card>
        ))}

        {appointments.length === 0 && (
          <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            暂无预约申请记录
          </div>
        )}
      </div>
    </div>
  );
}
