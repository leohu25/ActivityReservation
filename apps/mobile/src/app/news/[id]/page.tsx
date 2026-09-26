import React from "react";
import { notFound } from "next/navigation";
import { getTenantDbManager } from "@base/db-tenant";
import { getServerAuthRuntime } from "@base/auth";
import { ArrowLeft, Calendar, Eye, User } from "lucide-react";
import Link from "next/link";

interface NewsDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MobileNewsDetailPage({ params }: NewsDetailPageProps) {
  const { id } = await params;
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient("01a0d2ea-1691-7508-8ad3-bbd232a45b72");

  const news = await prisma.news.findUnique({
    where: { id, isDeleted: false },
    include: { venue: true },
  });

  if (!news) notFound();

  return (
    <div className="flex-1 flex flex-col p-5 bg-white">
      <header className="flex items-center gap-3 pt-3 pb-4 border-b border-slate-100">
        <Link
          href="/"
          className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition-transform"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <span className="font-semibold text-xs text-slate-600">场馆动态公告</span>
      </header>

      <div className="py-5 space-y-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-snug">
          {news.title}
        </h1>

        <div className="flex items-center gap-4 text-xs text-slate-400 pb-3 border-b border-slate-100">
          <span className="flex items-center gap-1">
            <User className="size-3.5 text-primary" />
            {news.author || "官方发布"}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="size-3.5" />
            {new Date(news.createdAt).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="size-3.5" />
            {news.viewsCount} 次浏览
          </span>
        </div>

        {news.summary && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed font-medium">
            导读：{news.summary}
          </div>
        )}

        <div
          className="text-xs text-slate-700 leading-relaxed space-y-3 pt-2"
          dangerouslySetInnerHTML={{ __html: news.content }}
        />
      </div>
    </div>
  );
}
