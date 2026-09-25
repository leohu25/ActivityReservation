import React from "react";
import { notFound } from "next/navigation";
import { getTenantDbManager } from "@base/db-tenant";
import { getServerAuthRuntime } from "@base/auth";
import { submitVolunteerAction } from "./actions";
import { ArrowLeft, HeartHandshake, Send } from "lucide-react";
import Link from "next/link";

interface VolunteerPageProps {
  params: Promise<{ id: string }>;
}

export default async function VolunteerEnrollPage({ params }: VolunteerPageProps) {
  const { id } = await params;
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient("01a0d2ea-1691-7508-8ad3-bbd232a45b72");

  const activity = await prisma.activity.findUnique({
    where: { id, isDeleted: false },
    include: { venue: true },
  });

  if (!activity) notFound();

  return (
    <div className="flex-1 flex flex-col p-5">
      <header className="flex items-center gap-3 pt-3 pb-5 border-b border-slate-100">
        <Link
          href={`/activity/${activity.id}`}
          className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition-transform"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-base font-bold tracking-tight">志愿者服务报名</h1>
          <p className="text-[11px] text-muted-foreground">{activity.title}</p>
        </div>
      </header>

      <form action={submitVolunteerAction} className="mt-5 space-y-4">
        <input type="hidden" name="activityId" value={activity.id} />

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">真实姓名 *</label>
            <input
              type="text"
              name="name"
              required
              placeholder="请输入您的姓名"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">联系电话 *</label>
            <input
              type="tel"
              name="phone"
              required
              placeholder="请输入11位手机号"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">学号 (校内必填)</label>
              <input
                type="text"
                name="studentNo"
                placeholder="如: S20240101"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">学院/专业</label>
              <input
                type="text"
                name="major"
                placeholder="如: 护理学院"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">意向岗位</label>
            <select
              name="serviceRole"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-primary"
            >
              <option value="展厅义务讲解员">展厅义务讲解员</option>
              <option value="参观动线引导员">参观动线引导员</option>
              <option value="急救技能演示助理">急救技能演示助理</option>
              <option value="场务与签到保障">场务与签到保障</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 bg-primary text-white font-semibold text-sm rounded-2xl shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <Send className="size-4" />
          提交志愿者申请
        </button>
      </form>
    </div>
  );
}
