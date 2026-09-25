import React from "react";
import { headers } from "next/headers";
import { getCurrentTenantContext } from "@base/auth";
import { listNewsQuery } from "@domain/activity-booking/news-management/server";
import { Card, CardHeader, CardTitle, CardContent, Badge, buttonVariants } from "@base/ui";
import { Plus, Newspaper, Calendar, Eye } from "lucide-react";
import Link from "next/link";

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
            发布并维护场馆动态公告、开放日通告及参观指南文章
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

      <div className="space-y-3">
        {newsList.map((item) => (
          <Card key={item.id} className="p-4 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base">{item.title}</span>
                {item.isTop && <Badge variant="destructive">置顶</Badge>}
                <Badge variant="outline">{item.status === "PUBLISHED" ? "已发布" : item.status}</Badge>
              </div>
              {item.summary && <p className="text-xs text-muted-foreground line-clamp-1">{item.summary}</p>}
              <div className="flex gap-4 text-xs text-slate-400">
                <span>作者: {item.author || "官方发布"}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="size-3" />
                  {item.viewsCount} 次浏览
                </span>
              </div>
            </div>
          </Card>
        ))}

        {newsList.length === 0 && (
          <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            暂无新闻资讯，点击右上角发布第一篇场馆公告
          </div>
        )}
      </div>
    </div>
  );
}
