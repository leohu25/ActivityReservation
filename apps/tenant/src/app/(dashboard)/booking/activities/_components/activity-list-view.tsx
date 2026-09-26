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
import { MasterDataStatus } from "@base/shared";
import { Clock, Users, MapPin, Calendar, HeartHandshake, Eye } from "lucide-react";
import Link from "next/link";

export interface ActivityDetailModalData {
  id: string;
  title: string;
  description?: string | null;
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

      {/* 活动完整详情查看弹窗 */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6 rounded-2xl">
          {selectedAct && (
            <>
              <DialogHeader className="border-b pb-4">
                <div className="flex items-center justify-between pr-6">
                  <DialogTitle className="text-lg font-bold">{selectedAct.title}</DialogTitle>
                  <Badge variant={selectedAct.status === "PUBLISHED" ? "default" : "secondary"}>
                    {selectedAct.status === "PUBLISHED" ? "已发布" : selectedAct.status}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-slate-500 mt-1">
                  所属场馆: {selectedAct.venue.name} · {selectedAct.venue.address || "校内展区"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-3 text-xs">
                {/* 规则参数 */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-slate-400">活动类型:</span>{" "}
                    <strong>
                      {selectedAct.type === "LECTURE"
                        ? "专业科普讲解"
                        : selectedAct.type === "VOLUNTEER"
                        ? "志愿招募活动"
                        : selectedAct.type === "INTERNAL"
                        ? "校内专属活动"
                        : "普通活动"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">审核模式:</span>{" "}
                    <strong>{selectedAct.auditMode === "AUTO" ? "免审自动通过" : "人工后台审核"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">团队拼团支持:</span>{" "}
                    <strong>{selectedAct.allowTeam ? `允许 (${selectedAct.minTeamSize}~${selectedAct.maxTeamSize}人)` : "仅限个人"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">开放日期:</span>{" "}
                    <span>
                      {new Date(selectedAct.startDate).toLocaleDateString()} ~ {new Date(selectedAct.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* 志愿者招募说明 */}
                {selectedAct.needVolunteer && (
                  <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/60 space-y-1">
                    <span className="font-bold text-rose-900 flex items-center gap-1.5">
                      <HeartHandshake className="size-4 text-rose-600" />
                      志愿者招募岗位
                    </span>
                    <p className="text-slate-700">{selectedAct.volunteerRoles || "展厅义务讲解员, 参观动线引导员"}</p>
                  </div>
                )}

                {/* 活动正文介绍 */}
                {selectedAct.description && (
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800">活动介绍与预约须知:</span>
                    <p className="text-slate-600 leading-relaxed p-3 rounded-xl bg-slate-50 border border-slate-100">
                      {selectedAct.description}
                    </p>
                  </div>
                )}

                {/* 排班场次一览 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">已排班场次 ({selectedAct.sessions.length})</span>
                    <Link
                      href={`/booking/activities/${selectedAct.id}/sessions`}
                      className="text-primary font-semibold hover:underline"
                    >
                      前往管理排班
                    </Link>
                  </div>
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                        <tr>
                          <th className="p-2.5 text-left">场次日期</th>
                          <th className="p-2.5 text-left">时段</th>
                          <th className="p-2.5 text-left">总容量</th>
                          <th className="p-2.5 text-left">已预约</th>
                          <th className="p-2.5 text-left">状态</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedAct.sessions.map((s) => (
                          <tr key={s.id}>
                            <td className="p-2.5 font-medium">{s.date}</td>
                            <td className="p-2.5">{s.startTime} ~ {s.endTime}</td>
                            <td className="p-2.5">{s.totalCapacity} 人</td>
                            <td className="p-2.5 text-primary font-semibold">{s.bookedCount} 人</td>
                            <td className="p-2.5">
                              <Badge variant={s.status === MasterDataStatus.ACTIVE ? "default" : "secondary"}>
                                {s.status === MasterDataStatus.ACTIVE ? "可预约" : s.status}
                              </Badge>
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
