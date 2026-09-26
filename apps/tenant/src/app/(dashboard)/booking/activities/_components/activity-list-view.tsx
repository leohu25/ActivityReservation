"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Badge,
} from "@base/ui";
import { Clock, Users, MapPin, Calendar, HeartHandshake, Eye, Sparkles } from "lucide-react";
import Link from "next/link";

export interface ActivityDetailModalData {
  id: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  type: string;
  auditMode: string;
  allowTeam: boolean;
  minTeamSize: number;
  maxTeamSize: number;
  startDate: Date | string;
  endDate: Date | string;
  status: string;
  needVolunteer: boolean;
  volunteerRoles?: string | null;
  venue: {
    name: string;
    address?: string | null;
    openTime?: string | null;
    contactPhone?: string | null;
  };
  sessions: Array<{
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    totalCapacity: number;
    bookedCount: number;
    status: string;
  }>;
}

export function ActivityListView({
  activities,
}: {
  readonly activities: ActivityDetailModalData[];
}) {
  const [selectedAct, setSelectedAct] = useState<ActivityDetailModalData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {activities.map((act) => (
          <div
            key={act.id}
            onClick={() => {
              setSelectedAct(act);
              setModalOpen(true);
            }}
            className="rounded-2xl border border-slate-200 bg-white p-5 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group hover:border-primary/50"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-base text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">
                  {act.title}
                </h3>
                <Badge variant={act.status === "PUBLISHED" ? "default" : "secondary"}>
                  {act.status === "PUBLISHED" ? "已发布" : act.status}
                </Badge>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0 text-primary" />
                  <span className="truncate">{act.venue.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 shrink-0 text-primary" />
                  <span>
                    {new Date(act.startDate).toLocaleDateString()} ~ {new Date(act.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="size-3.5 shrink-0 text-primary" />
                  <span>
                    共 {act.sessions.length} 个场次 · 总名额{" "}
                    {act.sessions.reduce((acc, s) => acc + s.totalCapacity, 0)} 人
                  </span>
                </div>
                {act.needVolunteer && (
                  <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2 py-1 rounded-md text-[11px] font-medium">
                    <HeartHandshake className="size-3.5 shrink-0" />
                    <span className="truncate">招募志愿者: {act.volunteerRoles || "展厅讲解"}</span>
                  </div>
                )}
              </div>
            </div>

            <div
              className="p-3 pt-2.5 border-t border-slate-100 flex items-center justify-between mt-3 bg-slate-50/50 rounded-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedAct(act);
                  setModalOpen(true);
                }}
                className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                <Eye className="size-3.5" />
                查看详情
              </button>
              <Link
                href={`/booking/activities/${act.id}/sessions`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <Clock className="size-3.5" />
                排班管理 ({act.sessions.length})
              </Link>
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed p-16 text-center text-muted-foreground bg-slate-50/50">
            暂无符合条件的活动记录，请点击右上角发布新活动
          </div>
        )}
      </div>

      {/* 活动完整图文详情查看弹窗 (重构升级版布局) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-slate-200 shadow-2xl">
          {selectedAct && (
            <>
              {/* 顶部深色精致卡片 */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-t-3xl relative overflow-hidden">
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20">
                      {selectedAct.type === "LECTURE"
                        ? "专业科普讲解"
                        : selectedAct.type === "VOLUNTEER"
                        ? "志愿招募活动"
                        : selectedAct.type === "INTERNAL"
                        ? "校内专属活动"
                        : "普通场馆活动"}
                    </span>
                    <Badge variant={selectedAct.status === "PUBLISHED" ? "default" : "secondary"}>
                      {selectedAct.status === "PUBLISHED" ? "已发布" : selectedAct.status}
                    </Badge>
                  </div>

                  <h2 className="text-xl font-black tracking-tight pt-1 leading-snug">
                    {selectedAct.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-white/80 pt-1">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3.5" />
                      {selectedAct.venue.name} ({selectedAct.venue.address || "校内展区"})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      开放周期: {new Date(selectedAct.startDate).toLocaleDateString()} ~{" "}
                      {new Date(selectedAct.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 主体图文与规格排布 */}
              <div className="p-6 space-y-6 text-xs text-slate-700 bg-slate-50/40">
                {/* 规则参数两列卡片 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 block text-[11px]">审核模式</span>
                    <strong className="text-slate-900 text-xs">
                      {selectedAct.auditMode === "AUTO" ? "⚡ 免审自动通过" : "⏳ 需人工审核"}
                    </strong>
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 block text-[11px]">拼团模式</span>
                    <strong className="text-slate-900 text-xs">
                      {selectedAct.allowTeam
                        ? `允许 (${selectedAct.minTeamSize}~${selectedAct.maxTeamSize}人)`
                        : "仅限个人预约"}
                    </strong>
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 block text-[11px]">下辖场次</span>
                    <strong className="text-slate-900 text-xs">{selectedAct.sessions.length} 个排班</strong>
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 block text-[11px]">容纳上限</span>
                    <strong className="text-slate-900 text-xs">
                      {selectedAct.sessions.reduce((acc, s) => acc + s.totalCapacity, 0)} 人
                    </strong>
                  </div>
                </div>

                {/* 志愿者招募说明 */}
                {selectedAct.needVolunteer && (
                  <div className="p-4 rounded-2xl border border-rose-200/80 bg-rose-50/60 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                        <HeartHandshake className="size-4 text-rose-600" />
                        本活动面向全校/社会公开招募志愿者
                      </span>
                      <p className="text-slate-700 text-xs leading-relaxed">
                        招募服务岗位: {selectedAct.volunteerRoles || "展厅义务讲解员, 参观动线引导员, 技能实操助理"}
                      </p>
                    </div>
                  </div>
                )}

                {/* 详细图文活动正文 (富文本渲染) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                    活动详细图文介绍与预约须知
                  </h3>
                  {selectedAct.description ? (
                    <div
                      className="p-3 leading-relaxed text-slate-800 space-y-2 prose prose-sm max-w-none prose-img:rounded-xl prose-img:max-h-80"
                      dangerouslySetInnerHTML={{ __html: selectedAct.description }}
                    />
                  ) : (
                    <p className="text-slate-400 italic py-4">暂无活动图文说明</p>
                  )}
                </div>

                {/* 排班场次明细列表 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-xs text-slate-900">
                      已排班场次明细 ({selectedAct.sessions.length})
                    </h3>
                    <Link
                      href={`/booking/activities/${selectedAct.id}/sessions`}
                      className="text-primary font-semibold text-xs hover:underline"
                    >
                      进入排班工作台 →
                    </Link>
                  </div>
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                        <tr>
                          <th className="p-2.5 text-left">场次日期</th>
                          <th className="p-2.5 text-left">开放时段</th>
                          <th className="p-2.5 text-left">总名额</th>
                          <th className="p-2.5 text-left">已预约</th>
                          <th className="p-2.5 text-left">剩余</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedAct.sessions.map((s) => (
                          <tr key={s.id}>
                            <td className="p-2.5 font-bold text-slate-900">{s.date}</td>
                            <td className="p-2.5 font-mono text-slate-600">
                              {s.startTime} ~ {s.endTime}
                            </td>
                            <td className="p-2.5">{s.totalCapacity} 人</td>
                            <td className="p-2.5 font-semibold text-primary">{s.bookedCount} 人</td>
                            <td className="p-2.5 font-bold text-green-600">
                              {s.totalCapacity - s.bookedCount} 人
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
