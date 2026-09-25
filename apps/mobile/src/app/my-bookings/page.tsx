import React from "react";
import { getTenantDbManager } from "@base/db-tenant";
import { getServerAuthRuntime } from "@base/auth";
import Link from "next/link";
import { Clock, Calendar, QrCode } from "lucide-react";

export default async function MyBookingsPage() {
  const runtime = getServerAuthRuntime();
  let orgId = "01a0d2ea-1691-7508-8ad3-bbd232a45b72";
  try {
    const org = await runtime.prisma.organization.findFirst({ select: { id: true } });
    if (org?.id) orgId = org.id;
  } catch {}

  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient(orgId);

  const bookings = await prisma.appointment.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
    include: {
      activity: true,
      session: true,
    },
  });

  return (
    <div className="flex-1 flex flex-col p-5">
      <header className="pt-4 pb-4">
        <h1 className="text-xl font-bold tracking-tight">我的预约记录</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          查看个人与团队预约进度及通行状态
        </p>
      </header>

      <div className="space-y-3 mt-2">
        {bookings.map((b) => {
          const isApproved = b.status === "APPROVED";
          const isPending = b.status === "PENDING";

          return (
            <div
              key={b.id}
              className="p-4 rounded-3xl bg-white border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm line-clamp-1">{b.activity.title}</span>
                <span
                  className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full shrink-0 ${
                    isApproved
                      ? "text-green-700 bg-green-50"
                      : isPending
                      ? "text-amber-700 bg-amber-50"
                      : "text-red-700 bg-red-50"
                  }`}
                >
                  {isApproved ? "已通过" : isPending ? "待审核" : "已驳回"}
                </span>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-primary" />
                  <span>
                    {b.session.date} {b.session.startTime} ~ {b.session.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" />
                  <span>
                    单号: {b.code} · 共 {b.peopleCount} 人 · 申请人: {b.applicantName}
                  </span>
                </div>
              </div>

              {isApproved && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-green-600 font-medium">凭证已生效，可入场</span>
                  <Link
                    href={`/qrcode?code=${b.code}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
                  >
                    <QrCode className="size-3.5" />
                    查看通行码
                  </Link>
                </div>
              )}
            </div>
          );
        })}

        {bookings.length === 0 && (
          <div className="py-16 text-center text-xs text-muted-foreground rounded-2xl border border-dashed border-slate-200">
            暂无预约记录
          </div>
        )}
      </div>
    </div>
  );
}
