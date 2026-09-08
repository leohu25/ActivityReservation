"use client";

import React, { useState, useTransition } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Button,
} from "@chenrun/ui";
import { ShieldCheck, Save, CheckCircle2, AlertCircle, Lock, Clock } from "lucide-react";
import type { SecuritySettingsData, UpdateSecuritySettingsInput } from "../types";
import { updateSecuritySettingsAction } from "../actions";

export interface SecuritySettingsViewProps {
  readonly initialData: SecuritySettingsData;
  readonly isReadOnly?: boolean;
}

/**
 * 租户安全策略配置面板组件
 */
export function SecuritySettingsView({
  initialData,
  isReadOnly = false,
}: SecuritySettingsViewProps) {
  const [formData, setFormData] = useState<UpdateSecuritySettingsInput>({
    sessionIdleTimeoutMinutes: initialData.sessionIdleTimeoutMinutes ?? 60,
    forceChangeInitialPassword: initialData.forceChangeInitialPassword ?? true,
    passwordMinLength: initialData.passwordMinLength ?? 8,
    requireSpecialChar: initialData.requireSpecialChar ?? true,
  });

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const res = await updateSecuritySettingsAction(formData);
      if (res.success) {
        setFeedback({ type: "success", message: "租户安全策略已成功更新并生效" });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "保存安全策略失败，请稍后重试",
        });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 顶部标题 */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ShieldCheck className="size-5 text-blue-600 dark:text-blue-400" />
          <span>企业安全设置</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          管控租户会话空闲登出超时、初始密码改密强制规则以及成员账号强度基线
        </p>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3.5 text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 会话安全策略 */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs dark:border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Clock className="size-4 text-blue-600 dark:text-blue-400" />
              <span>会话超时管理</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              设置成员未进行任何页面操作时的自动强制登出策略
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                闲置自动登出超时 (分钟)
              </label>
              <select
                value={formData.sessionIdleTimeoutMinutes ?? 60}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sessionIdleTimeoutMinutes: Number(e.target.value),
                  }))
                }
                disabled={isReadOnly || isPending}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value={15}>15 分钟 (高灵敏安全)</option>
                <option value={30}>30 分钟 (推荐标准)</option>
                <option value={60}>60 分钟 (1 小时常规)</option>
                <option value={480}>480 分钟 (8 小时工作日免登)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* 密码强度与凭证生命周期 */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs dark:border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Lock className="size-4 text-blue-600 dark:text-blue-400" />
              <span>凭据安全基线</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              规范租户内员工密码最小长度及首次登录改密强制要求
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  密码最小长度字符数
                </label>
                <Input
                  type="number"
                  min={6}
                  max={32}
                  value={formData.passwordMinLength ?? 8}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      passwordMinLength: Number(e.target.value),
                    }))
                  }
                  disabled={isReadOnly || isPending}
                />
                <span className="text-[11px] text-slate-400">
                  建议设置为 8 位以上以保障工业级抗撞库安全
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.forceChangeInitialPassword ?? true}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      forceChangeInitialPassword: e.target.checked,
                    }))
                  }
                  disabled={isReadOnly || isPending}
                  className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    首次登录强制修改初始密码
                  </span>
                  <p className="text-[11px] text-slate-400">
                    管理员直接开号分配临时密码后，员工首次登录成功时必须重置新密码方可进入系统
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requireSpecialChar ?? true}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      requireSpecialChar: e.target.checked,
                    }))
                  }
                  disabled={isReadOnly || isPending}
                  className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    强制要求包含特殊符号 (@#$%^&*)
                  </span>
                  <p className="text-[11px] text-slate-400">
                    提高暴力破解阻断阈值，避免弱口令安全隐患
                  </p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {!isReadOnly && (
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
            >
              <Save className="size-4" />
              <span>{isPending ? "正在保存..." : "保存安全策略"}</span>
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
