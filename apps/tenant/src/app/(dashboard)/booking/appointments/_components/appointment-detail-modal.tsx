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
import {
  Clock,
  User,
  Phone,
  Users,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building,
  CreditCard,
  Sparkles,
} from "lucide-react";

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
  checkedInAt?: Date | string | null;
  createdAt: Date | string;
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
  const isCheckedIn = appointment.status === "CHECKED_IN";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-slate-200 shadow-2xl">
        {/* 顶部精致头部背景 */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-t-3xl relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20">
                  {appointment.userType === "TEACHER"
                    ? "在校教师"
                    : appointment.userType === "STUDENT"
                    ? "在籍学生"
                    : "社会公众"}
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-white/90">
                  {isTeam ? "团队拼团预约" : appointment.type === "INTERNAL" ? "内部免审专线" : "个人预约"}
                </span>
              </div>
              <span className="font-mono text-xs text-white/70">预约单号: {appointment.code}</span>
            </div>

            <h2 className="text-xl font-black tracking-tight pt-1 leading-snug">
              {appointment.activity.title}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs text-white/80 pt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary-foreground/80" />
                参观日期: {appointment.session.date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-primary-foreground/80" />
                时段: {appointment.session.startTime} ~ {appointment.session.endTime}
              </span>
              <span className="flex items-center gap-1.5 font-bold text-amber-300">
                <Users className="size-3.5" />
                实到: {appointment.peopleCount} 人
              </span>
            </div>
          </div>
        </div>

        {/* 主体两列排布布局 */}
        <div className="p-6 space-y-6 text-xs text-slate-700 bg-slate-50/40">
          {/* 状态与核销横条 */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`size-10 rounded-xl flex items-center justify-center ${
                  isApproved || isCheckedIn
                    ? "bg-green-50 text-green-600 border border-green-200"
                    : isPending
                    ? "bg-amber-50 text-amber-600 border border-amber-200"
                    : "bg-red-50 text-red-600 border border-red-200"
                }`}
              >
                {isApproved || isCheckedIn ? (
                  <CheckCircle2 className="size-5" />
                ) : isPending ? (
                  <Clock className="size-5" />
                ) : (
                  <XCircle className="size-5" />
                )}
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900">
                  当前状态:{" "}
                  {isApproved
                    ? "已通过审批 (通行凭证已签发)"
                    : isCheckedIn
                    ? "已现场核销入场"
                    : isPending
                    ? "待场馆老师审核"
                    : "已驳回申请"}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  提交时间: {new Date(appointment.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {appointment.qrCodeSign && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-xl border border-green-200/80 font-semibold">
                <ShieldCheck className="size-4" />
                防伪通行码已激活
              </div>
            )}
          </div>

          {/* 两列网格：左侧申请人信息，右侧团队/场次详情 */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* 左列：申请人/领队信息 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <User className="size-4 text-primary" />
                {isTeam ? "领队联系人档案" : "申请人主体档案"}
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">姓名:</span>
                  <strong className="text-slate-900 font-semibold">{appointment.applicantName}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">联系手机:</span>
                  <strong className="text-slate-900 font-mono">{appointment.phone}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">证件号/工号:</span>
                  <span className="font-mono text-slate-700">{appointment.idCard || "未登记"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">所属部门/组织:</span>
                  <span className="text-slate-700 font-medium">{appointment.organization || "社会公众/自发"}</span>
                </div>
              </div>
            </div>

            {/* 右列：团队信息 或 场次容量 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Building className="size-4 text-primary" />
                {isTeam ? "团队拼团规格" : "场次预约负荷"}
              </h3>

              {isTeam && appointment.team ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">团队全称:</span>
                    <strong className="text-slate-900">{appointment.team.teamName}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">拼团邀请码:</span>
                    <strong className="font-mono text-primary text-sm tracking-wider font-bold">
                      {appointment.team.inviteCode}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">招募成团进度:</span>
                    <strong className="text-indigo-600">
                      已入团 {appointment.team.joinedCount} 人 / 目标 {appointment.team.targetCount} 人
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">场次总容纳:</span>
                    <strong className="text-slate-900">{appointment.session.totalCapacity} 人</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">已占用名额:</span>
                    <strong className="text-slate-900">{appointment.session.bookedCount} 人</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">当前剩余名额:</span>
                    <strong className="text-green-600">
                      {appointment.session.totalCapacity - appointment.session.bookedCount} 人
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 同行随行人员名单 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Users className="size-4 text-primary" />
                同行随行人员实名表 ({appointment.visitors.length} 人)
              </h3>
              <span className="text-[11px] text-slate-400">到馆请配合出示身份证件</span>
            </div>

            {appointment.visitors.length > 0 ? (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                    <tr>
                      <th className="p-2.5 text-left">序号</th>
                      <th className="p-2.5 text-left">姓名</th>
                      <th className="p-2.5 text-left">联系手机号</th>
                      <th className="p-2.5 text-left">身份类别</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointment.visitors.map((v, i) => (
                      <tr key={v.id}>
                        <td className="p-2.5 text-slate-400">{i + 1}</td>
                        <td className="p-2.5 font-bold text-slate-900">{v.name}</td>
                        <td className="p-2.5 font-mono text-slate-600">{v.phone || "-"}</td>
                        <td className="p-2.5">
                          <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                            {v.userType === "STUDENT" ? "学生" : v.userType === "TEACHER" ? "教师" : "社会公众"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                本预约单为单人申请，无随行同行人
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
