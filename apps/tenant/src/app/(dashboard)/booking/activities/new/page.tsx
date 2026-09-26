import React from "react";
import { headers } from "next/headers";
import { getCurrentTenantContext } from "@base/auth";
import { listVenuesQuery } from "@domain/activity-booking/venue-management/server";
import { createActivityAction } from "../../actions";
import { Card } from "@base/ui";
import { ArrowLeft, CalendarPlus, HeartHandshake, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { RichTextEditor } from "../../_components/rich-text-editor";

export default async function NewActivityPage() {
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);
  const venues = await listVenuesQuery(ctx.organizationId);

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/booking/activities"
          className="size-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">发布新活动</h1>
          <p className="text-xs text-muted-foreground mt-0.5">创建新的场馆活动、支持图文富文本编辑与排版须知</p>
        </div>
      </div>

      <Card className="p-6 border-slate-200 shadow-xs">
        <form action={createActivityAction} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">所属场馆 *</label>
              <select
                name="venueId"
                required
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-primary"
              >
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">封面图片 URL (选填)</label>
              <div className="relative">
                <ImageIcon className="size-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="url"
                  name="coverUrl"
                  placeholder="https://.../cover.jpg"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">活动主标题 *</label>
            <input
              type="text"
              name="title"
              required
              placeholder="如: 【春季开放日】医学护理技能实训实操体验"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">活动类型</label>
              <select
                name="type"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-primary"
              >
                <option value="GENERAL">普通场馆活动</option>
                <option value="LECTURE">专业科普讲解</option>
                <option value="VOLUNTEER">志愿服务招募</option>
                <option value="INTERNAL">校内专属活动</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">审核模式</label>
              <select
                name="auditMode"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-primary"
              >
                <option value="MANUAL">人工审核 (推荐)</option>
                <option value="AUTO">免审自动通过</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">活动开始日期 *</label>
              <input
                type="date"
                name="startDate"
                required
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">活动截止日期 *</label>
              <input
                type="date"
                name="endDate"
                required
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              name="allowTeam"
              id="allowTeam"
              defaultChecked
              className="size-4 text-primary rounded border-slate-300"
            />
            <label htmlFor="allowTeam" className="text-xs font-medium text-slate-700">
              允许团队拼团预约 (领队开团 + 队员加入模式)
            </label>
          </div>

          {/* 志愿者招募配置 */}
          <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/50 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="needVolunteer"
                id="needVolunteer"
                className="size-4 text-rose-600 rounded border-slate-300"
              />
              <label htmlFor="needVolunteer" className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <HeartHandshake className="size-4 text-rose-600" />
                开启本活动志愿者招募
              </label>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-600">
                可招募的服务岗位/服务项目 (多个岗位用逗号隔开)
              </label>
              <input
                type="text"
                name="volunteerRoles"
                defaultValue="展厅义务讲解员, 参观动线引导员, 急救技能演示助理"
                className="w-full text-xs px-3.5 py-2 rounded-xl bg-white border border-rose-200 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* 图文富文本编辑器 */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              活动详情与图文预约须知 (支持排版与图片)
            </label>
            <RichTextEditor
              name="description"
              placeholder="编写详细活动说明，可在此加粗重点、设置分段并插入配图..."
              minHeight="260px"
            />
          </div>

          <div className="pt-3 border-t flex justify-end gap-2.5">
            <Link
              href="/booking/activities"
              className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              取消
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
            >
              <CalendarPlus className="size-4" />
              立即发布
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
