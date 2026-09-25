"use client";

import React, { useState } from "react";
import { submitAppointmentAction } from "./actions";
import { Clock, Users, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

interface SessionItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  totalCapacity: number;
  bookedCount: number;
  status: string;
}

interface ActivityDetailClientProps {
  activity: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    auditMode: string;
    allowTeam: boolean;
    venue: {
      name: string;
      address: string | null;
      openTime: string | null;
    };
    sessions: SessionItem[];
  };
}

export function ActivityDetailClient({ activity }: ActivityDetailClientProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    activity.sessions[0]?.id || "",
  );
  const [bookingType, setBookingType] = useState<"INDIVIDUAL" | "TEAM">("INDIVIDUAL");
  const [hasVisitor, setHasVisitor] = useState(false);

  return (
    <div className="flex-1 flex flex-col pb-8">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-4 py-3 border-b border-slate-100 flex items-center gap-3">
        <Link
          href="/"
          className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition-transform"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <span className="font-semibold text-sm line-clamp-1">活动预约详情</span>
      </header>

      {/* 活动基本信息卡片 */}
      <div className="p-4 space-y-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
              {activity.type === "LECTURE" ? "专业讲解" : "场馆活动"}
            </span>
            <span className="text-xs text-muted-foreground">{activity.venue.name}</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 leading-snug">{activity.title}</h1>
          {activity.description && (
            <p className="text-xs text-slate-500 leading-relaxed">{activity.description}</p>
          )}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>地址: {activity.venue.address || "校内展区"}</span>
            <span>{activity.auditMode === "AUTO" ? "⚡ 免审秒过" : "⏳ 需管理员审核"}</span>
          </div>
        </div>

        {/* 预约表单 */}
        <form action={submitAppointmentAction} className="space-y-4">
          <input type="hidden" name="activityId" value={activity.id} />
          <input type="hidden" name="type" value={bookingType} />
          <input type="hidden" name="sessionId" value={selectedSessionId} />

          {/* 1. 选择预约场次 */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] space-y-3">
            <h2 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              选择预约场次
            </h2>
            <div className="grid gap-2.5">
              {activity.sessions.map((sess) => {
                const remain = sess.totalCapacity - sess.bookedCount;
                const isSelected = selectedSessionId === sess.id;
                const isFull = remain <= 0;

                return (
                  <button
                    key={sess.id}
                    type="button"
                    disabled={isFull}
                    onClick={() => setSelectedSessionId(sess.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                        : isFull
                        ? "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
                        : "border-slate-100 bg-white hover:border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="font-medium text-xs">
                        {sess.date} ({sess.startTime} ~ {sess.endTime})
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        总容量 {sess.totalCapacity} 人
                      </div>
                    </div>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        isFull
                          ? "bg-slate-200 text-slate-500"
                          : isSelected
                          ? "bg-primary text-white"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {isFull ? "已满额" : `余 ${remain} 人`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. 预约模式切换 */}
          {activity.allowTeam && (
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setBookingType("INDIVIDUAL")}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                  bookingType === "INDIVIDUAL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                个人预约
              </button>
              <button
                type="button"
                onClick={() => setBookingType("TEAM")}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                  bookingType === "TEAM" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                团队拼团预约
              </button>
            </div>
          )}

          {/* 3. 填写预约人信息 */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] space-y-3.5">
            <h2 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
              <Users className="size-4 text-primary" />
              {bookingType === "TEAM" ? "团队领队信息" : "预约人信息"}
            </h2>

            {bookingType === "TEAM" && (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500">团队名称 *</label>
                <input
                  type="text"
                  name="teamName"
                  required
                  placeholder="如: 宁波卫生职院24级护理3班"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500">真实姓名 *</label>
              <input
                type="text"
                name="applicantName"
                required
                placeholder="请填写真实姓名"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500">联系电话 *</label>
              <input
                type="tel"
                name="phone"
                required
                placeholder="请输入11位手机号"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500">所属单位 / 学院 (选填)</label>
              <input
                type="text"
                name="organization"
                placeholder="如: 宁波市第一医院 / 护理学院"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>

            {/* 同行人添加选框 */}
            {bookingType === "INDIVIDUAL" && (
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">是否携带同行人？</span>
                  <button
                    type="button"
                    onClick={() => setHasVisitor(!hasVisitor)}
                    className={`text-xs px-3 py-1 rounded-full border transition-all ${
                      hasVisitor ? "bg-primary text-white border-primary" : "text-slate-500 border-slate-200"
                    }`}
                  >
                    {hasVisitor ? "已添加同行人" : "+ 添加同行人"}
                  </button>
                </div>

                {hasVisitor && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 space-y-2.5">
                    <input
                      type="text"
                      name="visitorName"
                      placeholder="同行人真实姓名"
                      className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary"
                    />
                    <input
                      type="tel"
                      name="visitorPhone"
                      placeholder="同行人手机号 (选填)"
                      className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 提交按钮 */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!selectedSessionId}
              className="w-full py-3.5 bg-primary text-white font-semibold text-sm rounded-2xl shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Send className="size-4" />
              立即确认预约
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-2">
              提交后可在「我的预约」随时查看状态与入场通行凭证
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
