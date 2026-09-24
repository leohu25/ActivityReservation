import React from "react";
import { headers } from "next/headers";
import { getCurrentTenantContext } from "@base/auth";
import { listActivitiesQuery } from "@domain/activity-booking/activity-management/server";
import { Card, CardHeader, CardTitle, CardContent, Badge, buttonVariants } from "@base/ui";
import Link from "next/link";
import { Calendar, Users, MapPin, Plus } from "lucide-react";

export default async function ActivitiesPage() {
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);
  const activities = await listActivitiesQuery(ctx.organizationId);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">活动管理</h1>
          <p className="text-sm text-muted-foreground">
            发布、排班场次名额以及管理宁卫预约活动
          </p>
        </div>
        <Link
          href="/booking/activities/new"
          className={buttonVariants({ variant: "default" })}
        >
          <Plus className="mr-1.5 size-4" />
          发布新活动
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {activities.map((act) => (
          <Card key={act.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base line-clamp-1">{act.title}</CardTitle>
                <Badge variant={act.status === "PUBLISHED" ? "default" : "secondary"}>
                  {act.status === "PUBLISHED" ? "已发布" : act.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-primary" />
                <span className="truncate">{act.venue.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="size-4 shrink-0 text-primary" />
                <span>
                  {new Date(act.startDate).toLocaleDateString()} ~ {new Date(act.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="size-4 shrink-0 text-primary" />
                <span>
                  共 {act.sessions.length} 个场次 · 总容纳{" "}
                  {act.sessions.reduce((acc, s) => acc + s.totalCapacity, 0)} 人
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {activities.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            暂无发布的活动，点击右上角发布您的第一个场馆预约活动！
          </div>
        )}
      </div>
    </div>
  );
}
