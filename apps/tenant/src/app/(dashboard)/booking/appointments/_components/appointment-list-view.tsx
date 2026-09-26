"use client";

import React, { useState } from "react";
import { Card, Badge } from "@base/ui";
import { CheckCircle2, XCircle, Clock, Users, Phone, User, Eye } from "lucide-react";
import { AppointmentDetailModal, type AppointmentDetailData } from "./appointment-detail-modal";

interface AppointmentListViewProps {
  readonly appointments: AppointmentDetailData[];
  readonly auditAction: (formData: FormData) => Promise<void>;
}

export function AppointmentListView({
  appointments,
  auditAction,
}: AppointmentListViewProps) {
  const [selectedAppt, setSelectedAppt] = useState<AppointmentDetailData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenDetail = (appt: AppointmentDetailData) => {
    setSelectedAppt(appt);
    setModalOpen(true);
  };

  return (
    <div className="space-y-3.5">
      {appointments.map((appt) => {
        const isTeam = appt.type === "TEAM";
        const isInternal = appt.type === "INTERNAL";

        return (
          <Card
            key={appt.id}
            className="p-5 border-slate-200 hover:shadow-xs transition-shadow cursor-pointer hover:border-primary/40 group"
            onClick={() => handleOpenDetail(appt)}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-base text-slate-900 group-hover:text-primary transition-colors">
                    {appt.activity.title}
                  </span>

                  {/* 三级用户身份徽章 */}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      appt.userType === "TEACHER"
                        ? "bg-blue-100 text-blue-700"
                        : appt.userType === "STUDENT"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {appt.userType === "TEACHER"
                      ? "教师预约"
                      : appt.userType === "STUDENT"
                      ? "学生预约"
                      : "社会公众"}
                  </span>

                  <Badge variant={isTeam ? "secondary" : isInternal ? "default" : "outline"}>
                    {isTeam ? "团队拼团" : isInternal ? "内部免审" : "个人自发"}
                  </Badge>

                  <Badge
                    variant={
                      appt.status === "APPROVED"
                        ? "default"
                        : appt.status === "REJECTED"
                        ? "destructive"
                        : appt.status === "CHECKED_IN"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {appt.status === "APPROVED"
                      ? "已通过"
                      : appt.status === "REJECTED"
                      ? "已驳回"
                      : appt.status === "CHECKED_IN"
                      ? "已核销入场"
                      : "待审核"}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-muted-foreground">
                  <span className="font-mono">单号: {appt.code}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5 text-slate-400" />
                    {appt.session.date} ({appt.session.startTime} ~ {appt.session.endTime})
                  </span>
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <User className="size-3.5 text-primary" />
                    申请人/领队: {appt.applicantName} ({appt.phone})
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5 text-slate-400" />
                    实到人数: {appt.peopleCount} 人
                  </span>
                  {appt.organization && <span>所属: {appt.organization}</span>}
                </div>

                {/* 团队专属信息展示区 */}
                {isTeam && appt.team && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">
                        团队名: {appt.team.teamName} (邀请码:{" "}
                        <span className="font-mono text-primary">{appt.team.inviteCode}</span>)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        拼团进度: {appt.team.joinedCount} / {appt.team.targetCount} 人
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 操作栏 (阻止冒泡，避免触发弹窗) */}
              <div
                className="flex sm:flex-col items-end gap-2 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => handleOpenDetail(appt)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
                >
                  <Eye className="size-3.5" />
                  查看详情
                </button>

                {appt.status === "PENDING" && (
                  <div className="flex items-center gap-2">
                    <form action={auditAction}>
                      <input type="hidden" name="appointmentId" value={appt.id} />
                      <input type="hidden" name="action" value="APPROVE" />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="size-3.5" />
                        通过
                      </button>
                    </form>
                    <form action={auditAction}>
                      <input type="hidden" name="appointmentId" value={appt.id} />
                      <input type="hidden" name="action" value="REJECT" />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        <XCircle className="size-3.5" />
                        驳回
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}

      {appointments.length === 0 && (
        <div className="rounded-2xl border border-dashed p-16 text-center text-muted-foreground bg-slate-50/50">
          当前分类下暂无预约记录
        </div>
      )}

      {/* 详情模态弹窗 */}
      <AppointmentDetailModal
        appointment={selectedAppt}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
