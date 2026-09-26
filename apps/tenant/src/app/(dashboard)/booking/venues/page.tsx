import React from "react";
import { headers } from "next/headers";
import { getCurrentTenantContext } from "@base/auth";
import { listVenuesQuery } from "@domain/activity-booking/venue-management/server";
import { buttonVariants } from "@base/ui";
import { Plus } from "lucide-react";
import Link from "next/link";
import { VenueListView } from "./_components/venue-list-view";

export default async function VenuesPage() {
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);
  const venues = await listVenuesQuery(ctx.organizationId);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">场馆档案与空间</h1>
          <p className="text-xs text-muted-foreground mt-1">
            管理宁卫下属各场馆基本信息、开放时间及场所空间分区（支持点击卡片查看完整详情）
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

      <VenueListView venues={venues as any} />
    </div>
  );
}
