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
import { Clock, User, Phone, Users, Calendar, ShieldCheck, FileText, CheckCircle2, XCircle } from "lucide-react";

export interface AppointmentDetailData {
  id: string;
  code: string;
  type: string;
  userType: string;
  applicantName: string;
  phone: string;
  idCard?: string | null;
  organization?: string | null;
  peopleCount: number;
  status: string;
  auditRemark?: string | null;
  auditedAt?: Date | string | null;
  qrCodeSign?: string | null;
  activity: {
    id: string;
    title: string;
    description?: string | null;
    type: string;
  };
  session: {
    date: string;
    startTime: string;
    endTime: string;
    totalCapacity: number;
    bookedCount: number;
  };
  visitors: Array<{
    id: string;
    name: string;
    phone?: string | null;
    idCard?: string | null;
    userType: string;
  }>;
  team?: {
    teamName: string;
    inviteCode: string;
    leaderName: string;
    leaderPhone: string;
    targetCount: number;
    joinedCount: number;
  } | null;
}

interface AppointmentDetailModalProps {
  readonly appointment: AppointmentDetailData | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onAuditAction?: (id: string, action: "APPROVE" | "REJECT") => Promise<void>;
}

export function AppointmentDetailModal({
  appointment,
  open,
  onOpenChange,
}: AppointmentDetailModalProps) {
  if (!appointment) return null;

  const isTeam = appointment.type === "TEAM";
  const isApproved = appointment.status === "APPROVED";
  const isPending = appointment.status === "PENDING";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6 rounded-2xl">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-lg font-bold">预约申请详情</DialogTitle>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  appointment.userType === "TEACHER"
                    ? "bg-blue-100 text-blue-700"
                    : appointment.userType === "STUDENT"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {appointment.userType === "TEACHER"
                  ? "教师预约"
                  : appointment.userType === "STUDENT"
                  ? "学生预约"
                  : "社会公众"}
              </span>
              <Badge variant={isApproved ? "default" : isPending ? "outline" : "destructive"}>
                {isApproved ? "已通过" : isPending ? "待审核" : "已驳回"}
              </Badge>
            </div>
            <span className="font-mono text-xs text-muted-foreground">单号: {appointment.code}</span>
          </div>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            查看预约申请人基本信息、所报场次容量、团队成员名册及同行随行人员
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-3">
          {/* 1. 活动与场次信息 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
            <h3 className="font-bold text-slate-800 text-sm">{appointment.activity.title}</h3>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary" />
                参观日期: {appointment.session.date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-primary" />
                场次时段: {appointment.session.startTime} ~ {appointment.session.endTime}
              </span>
            </div>
          </div>

          {/* 2. 申请人主体信息 */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <User className="size-4 text-primary" />
              {isTeam ? "团队领队信息" : "申请人核心档案"}
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs p-3.5 rounded-xl border border-slate-100 bg-white shadow-2xs">
              <div>
                <span className="text-slate-400">姓名:</span>{" "}
                <strong className="text-slate-800">{appointment.applicantName}</strong>
              </div>
              <div>
                <span className="text-slate-400">联系电话:</span>{" "}
                <strong className="text-slate-800">{appointment.phone}</strong>
              </div>
              <div>
                <span className="text-slate-400">所属单位:</span>{" "}
                <span className="text-slate-700">{appointment.organization || "无/个人"}</span>
              </div>
              <div>
                <span className="text-slate-400">申请到访人数:</span>{" "}
                <strong className="text-slate-900">{appointment.peopleCount} 人</strong>
              </div>
            </div>
          </div>

          {/* 3. 若为团队预约，展示团队名册 */}
          {isTeam && appointment.team && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="size-4 text-primary" />
                团队拼团信息与进度
              </h4>
              <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-950">团队名称: {appointment.team.teamName}</span>
                  <span className="font-mono text-primary font-bold">邀请码: {appointment.team.inviteCode}</span>
                </div>
                <div className="text-slate-600">
                  拼团状态: 已入团 <strong>{appointment.team.joinedCount}</strong> 人 / 目标招募{" "}
                  <strong>{appointment.team.targetCount}</strong> 人
                </div>
              </div>
            </div>
          )}

          {/* 4. 同行随行人员名单 */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Users className="size-4 text-primary" />
              随行同行人名册 ({appointment.visitors.length} 人)
            </h4>
            {appointment.visitors.length > 0 ? (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                    <tr>
                      <th className="p-2.5 text-left">序号</th>
                      <th className="p-2.5 text-left">同行人姓名</th>
                      <th className="p-2.5 text-left">联系手机号</th>
                      <th className="p-2.5 text-left">身份类别</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointment.visitors.map((v, i) => (
                      <tr key={v.id}>
                        <td className="p-2.5 text-slate-400">{i + 1}</td>
                        <td className="p-2.5 font-medium text-slate-800">{v.name}</td>
                        <td className="p-2.5 text-slate-600">{v.phone || "-"}</td>
                        <td className="p-2.5 text-slate-500">{v.userType === "STUDENT" ? "学生" : "公众"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">本预约单未携带同行人</p>
            )}
          </div>

          {/* 5. 通行凭证与签发记录 */}
          {isApproved && appointment.qrCodeSign && (
            <div className="p-3.5 rounded-xl border border-green-200 bg-green-50/50 text-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-bold text-green-800 flex items-center gap-1">
                  <ShieldCheck className="size-4 text-green-600" />
                  已签发官方入场防伪通行码
                </span>
                <span className="font-mono text-[11px] text-green-700">{appointment.qrCodeSign}</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
