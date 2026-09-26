"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Badge,
  Card,
} from "@base/ui";
import { Newspaper, Calendar, Eye, User } from "lucide-react";

export interface NewsListItemData {
  id: string;
  title: string;
  summary?: string | null;
  content: string;
  author?: string | null;
  viewsCount: number;
  isTop: boolean;
  status: string;
  createdAt: Date | string;
  venue?: {
    id: string;
    name: string;
  } | null;
}

export function NewsListView({
  newsList,
}: {
  readonly newsList: NewsListItemData[];
}) {
  const [selectedNews, setSelectedNews] = useState<NewsListItemData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-3">
        {newsList.map((item) => (
          <Card
            key={item.id}
            onClick={() => {
              setSelectedNews(item);
              setModalOpen(true);
            }}
            className="p-4 flex items-center justify-between border-slate-200 hover:shadow-xs hover:border-primary/50 transition-all cursor-pointer group"
          >
            <div className="space-y-1.5 flex-1 pr-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-900 group-hover:text-primary transition-colors">
                  {item.title}
                </span>
                {item.isTop && <Badge variant="destructive">置顶推荐</Badge>}
                <Badge variant="outline">{item.status === "PUBLISHED" ? "已发布" : item.status}</Badge>
              </div>
              {item.summary && <p className="text-xs text-muted-foreground line-clamp-1">{item.summary}</p>}
              <div className="flex gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <User className="size-3 text-slate-400" />
                  作者: {item.author || "官方发布"}
                </span>
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

            <button
              type="button"
              onClick={() => {
                setSelectedNews(item);
                setModalOpen(true);
              }}
              className="text-xs font-semibold text-primary hover:underline shrink-0"
            >
              阅读正文
            </button>
          </Card>
        ))}

        {newsList.length === 0 && (
          <div className="rounded-2xl border border-dashed p-16 text-center text-muted-foreground bg-slate-50/50">
            暂无新闻资讯，点击右上角发布第一篇场馆公告
          </div>
        )}
      </div>

      {/* 新闻详情弹窗 */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6 rounded-2xl">
          {selectedNews && (
            <>
              <DialogHeader className="border-b pb-4">
                <div className="flex items-center gap-2">
                  {selectedNews.isTop && <Badge variant="destructive">置顶</Badge>}
                  <DialogTitle className="text-lg font-bold leading-snug">{selectedNews.title}</DialogTitle>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                  <span>作者: {selectedNews.author || "官方发布"}</span>
                  <span>发布时间: {new Date(selectedNews.createdAt).toLocaleDateString()}</span>
                  <span>浏览次数: {selectedNews.viewsCount} 次</span>
                </div>
              </DialogHeader>

              <div className="space-y-4 pt-3 text-xs">
                {selectedNews.summary && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 font-medium text-slate-700 leading-relaxed">
                    摘要导读: {selectedNews.summary}
                  </div>
                )}

                <div
                  className="p-3 leading-relaxed text-slate-800 space-y-3"
                  dangerouslySetInnerHTML={{ __html: selectedNews.content }}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
