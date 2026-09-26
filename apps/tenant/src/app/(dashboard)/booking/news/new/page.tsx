import React from "react";
import { createNewsAction } from "../../actions";
import { Card } from "@base/ui";
import { ArrowLeft, Send, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { RichTextEditor } from "../../_components/rich-text-editor";

export default function NewNewsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/booking/news"
          className="size-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">发布场馆新闻</h1>
          <p className="text-xs text-muted-foreground mt-0.5">录入场馆最新资讯公告、支持图文并茂排版与封面设置</p>
        </div>
      </div>

      <Card className="p-6 border-slate-200 shadow-xs">
        <form action={createNewsAction} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">新闻标题 *</label>
            <input
              type="text"
              name="title"
              required
              placeholder="如: 宁波卫生职业技术学院校史馆2026年秋季开馆公告"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">封面图片 URL (选填)</label>
              <div className="relative">
                <ImageIcon className="size-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="url"
                  name="coverUrl"
                  placeholder="https://.../news-cover.jpg"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">发布作者 / 部门</label>
              <input
                type="text"
                name="author"
                defaultValue="校史馆运营办公室"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              name="isTop"
              id="isTop"
              className="size-4 text-primary rounded border-slate-300"
            />
            <label htmlFor="isTop" className="text-xs font-medium text-slate-700">
              设为首页置顶推荐公告
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">摘要导读 (列表预览展示)</label>
            <input
              type="text"
              name="summary"
              placeholder="一句话介绍新闻核心亮点..."
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
            />
          </div>

          {/* 图文富文本编辑器 */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">新闻正文内容 (支持图文排版) *</label>
            <RichTextEditor
              name="content"
              placeholder="输入新闻详细正文，支持加粗、标题分级、插入段落与配图..."
              minHeight="280px"
            />
          </div>

          <div className="pt-3 border-t flex justify-end gap-2.5">
            <Link
              href="/booking/news"
              className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              取消
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
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
