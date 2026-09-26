import React from "react";
import { headers } from "next/headers";
import { getCurrentTenantContext } from "@base/auth";
import { listActivitiesQuery } from "@domain/activity-booking/activity-management/server";
import { Card, buttonVariants } from "@base/ui";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { ActivityListView } from "./_components/activity-list-view";

interface ActivitiesPageProps {
  searchParams: Promise<{ keyword?: string; status?: string; type?: string }>;
}

export default async function ActivitiesPage({ searchParams }: ActivitiesPageProps) {
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);
  const { keyword, status, type } = await searchParams;

  let activities = await listActivitiesQuery(ctx.organizationId);

  // 前端多条件过滤
  if (keyword) {
    const kw = keyword.trim().toLowerCase();
    activities = activities.filter(
      (a) => a.title.toLowerCase().includes(kw) || a.venue.name.toLowerCase().includes(kw),
    );
  }
  if (status) {
    activities = activities.filter((a) => a.status === status);
  }
  if (type) {
    activities = activities.filter((a) => a.type === type);
  }

  return (
    <div className="space-y-6 p-6">
      {/* 顶部标题区 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">活动与排班管理</h1>
          <p className="text-xs text-muted-foreground mt-1">
            发布场馆活动、设置是否招募志愿者及服务岗位、排布场次预约名额（支持点击卡片查看完整详情）
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

      {/* 条件筛选栏 (Filter Bar) */}
      <Card className="p-4 bg-slate-50/60 border-slate-200 shadow-xs">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="size-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              name="keyword"
              defaultValue={keyword || ""}
              placeholder="搜索活动标题或所属场馆..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <select
              name="type"
              defaultValue={type || ""}
              className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-primary"
            >
              <option value="">全部活动类型</option>
              <option value="GENERAL">普通场馆活动</option>
              <option value="LECTURE">专业科普讲解</option>
              <option value="VOLUNTEER">志愿服务招募</option>
              <option value="INTERNAL">校内专属活动</option>
            </select>
          </div>
          <div className="flex gap-2">
            <select
              name="status"
              defaultValue={status || ""}
              className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-primary"
            >
              <option value="">全部状态</option>
              <option value="PUBLISHED">已发布</option>
              <option value="DRAFT">草稿</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
            >
              筛选
            </button>
            {(keyword || status || type) && (
              <Link
                href="/booking/activities"
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-900 border border-slate-200 bg-white rounded-lg flex items-center justify-center shrink-0"
              >
                重置
              </Link>
            )}
          </div>
        </form>
      </Card>

      {/* 活动列表与详情交互视图 */}
      <ActivityListView activities={activities as any} />
    </div>
  );
}
