import React from "react";
import { createVenueAction } from "../../actions";
import { Card } from "@base/ui";
import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";

export default function NewVenuePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/booking/venues"
          className="size-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">新增场馆档案</h1>
          <p className="text-xs text-muted-foreground">录入新场馆基本信息、开放时段及对外服务联系方式</p>
        </div>
      </div>

      <Card className="p-6">
        <form action={createVenueAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">场馆编码 *</label>
              <input
                type="text"
                name="code"
                required
                placeholder="如: VENUE-NW-02"
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">场馆名称 *</label>
              <input
                type="text"
                name="name"
                required
                placeholder="如: 宁卫中医药标本馆"
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">场馆地址</label>
            <input
              type="text"
              name="address"
              placeholder="如: 宁波市高教园区学府路88号 实训南楼3层"
              className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">开放时间说明</label>
              <input
                type="text"
                name="openTime"
                placeholder="如: 周一至周五 08:30 - 17:00"
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">联系电话</label>
              <input
                type="text"
                name="contactPhone"
                placeholder="如: 0574-88886666"
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              name="isDefault"
              id="isDefault"
              className="size-4 text-primary rounded border-slate-300"
            />
            <label htmlFor="isDefault" className="text-xs font-medium text-slate-700">
              设为默认主场馆
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">场馆简介</label>
            <textarea
              name="description"
              rows={3}
              placeholder="简要介绍场馆历史、展陈内容及亮点..."
              className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="pt-3 border-t flex justify-end gap-2.5">
            <Link
              href="/booking/venues"
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              取消
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Building2 className="size-4" />
              保存场馆
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
