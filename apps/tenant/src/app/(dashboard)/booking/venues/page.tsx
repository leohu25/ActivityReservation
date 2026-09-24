import React from "react";
import { headers } from "next/headers";
import { getCurrentTenantContext } from "@base/auth";
import { listVenuesQuery } from "@domain/activity-booking/venue-management/server";
import { Card, CardHeader, CardTitle, CardContent, Badge, buttonVariants } from "@base/ui";
import { Building2, MapPin, Clock, Phone, Plus } from "lucide-react";
import Link from "next/link";

export default async function VenuesPage() {
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);
  const venues = await listVenuesQuery(ctx.organizationId);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">场馆档案与空间</h1>
          <p className="text-sm text-muted-foreground">
            管理宁卫下属各场馆基本信息、开放时间及场所空间分区
          </p>
        </div>
        <Link
          href="/booking/venues/new"
          className={buttonVariants({ variant: "default" })}
        >
          <Plus className="mr-1.5 size-4" />
          新增场馆
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {venues.map((venue) => (
          <Card key={venue.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="size-4 text-primary" />
                  {venue.name}
                </CardTitle>
                {venue.isDefault && <Badge variant="secondary">默认主馆</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0" />
                <span>{venue.address || "未设置地址"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 shrink-0" />
                <span>{venue.openTime || "未设置开放时间"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-4 shrink-0" />
                <span>{venue.contactPhone || "未设置联系电话"}</span>
              </div>
              <div className="pt-2 border-t text-xs">
                <span>下辖空间区域: {venue.spaces.length} 个</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {venues.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            暂无场馆档案，请点击右上角新增
          </div>
        )}
      </div>
    </div>
  );
}
