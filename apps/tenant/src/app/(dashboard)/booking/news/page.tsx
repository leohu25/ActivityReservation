import React from "react";
import { headers } from "next/headers";
import { getCurrentTenantContext } from "@base/auth";
import { listNewsQuery } from "@domain/activity-booking/news-management/server";
import { buttonVariants } from "@base/ui";
import { Plus } from "lucide-react";
import Link from "next/link";
import { NewsListView } from "./_components/news-list-view";

export default async function NewsManagePage() {
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);
  const newsList = await listNewsQuery(ctx.organizationId);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">场馆新闻与资讯发布</h1>
          <p className="text-sm text-muted-foreground">
            发布并维护场馆动态公告、开放日通告及参观指南文章（支持点击阅读正文详情）
          </p>
        </div>
        <Link
          href="/booking/news/new"
          className={buttonVariants({ variant: "default" })}
        >
          <Plus className="mr-1.5 size-4" />
          发布新闻
        </Link>
      </div>

      <NewsListView newsList={newsList as any} />
    </div>
  );
}
