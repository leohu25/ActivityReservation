import React from "react";
import { createNewsAction } from "../../actions";
import { Card } from "@base/ui";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

export default function NewNewsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/booking/news"
          className="size-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">发布场馆新闻</h1>
          <p className="text-xs text-muted-foreground">录入场馆最新资讯公告并推送到前端展示</p>
        </div>
      </div>

      <Card className="p-6">
        <form action={createNewsAction} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">新闻标题 *</label>
            <input
              type="text"
              name="title"
              required
              placeholder="如: 宁波卫生职业技术学院校史馆2026年秋季开馆公告"
              className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">发布作者 / 部门</label>
              <input
                type="text"
                name="author"
                defaultValue="校史馆运营办公室"
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                name="isTop"
                id="isTop"
                className="size-4 text-primary rounded border-slate-300"
              />
              <label htmlFor="isTop" className="text-xs font-medium text-slate-700">
                设为首页置顶推荐
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">摘要简述 (用于列表预览)</label>
            <input
              type="text"
              name="summary"
              placeholder="一句话介绍新闻核心亮点..."
              className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">新闻正文内容 *</label>
            <textarea
              name="content"
              required
              rows={6}
              placeholder="详细输入新闻公告正文内容，支持分段..."
              className="w-full text-xs p-3.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t flex justify-end gap-2.5">
            <Link
              href="/booking/news"
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              取消
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Send className="size-4" />
              立即发布
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
