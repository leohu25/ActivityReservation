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
  Checkbox,
  Label,
  PageShell,
  Combobox,
  toast,
} from "@base/ui";
import { ShieldCheck, Save, Lock, Clock } from "lucide-react";
import type { SecuritySettingsData } from "../types";
import type { UpdateSecuritySettingsSchemaInput } from "../schema";
import { updateSecuritySettingsAction } from "../actions";

export interface SecuritySettingsViewProps {
  readonly data: SecuritySettingsData;
  /** @deprecated 请直接使用 data */
  readonly initialData?: SecuritySettingsData;
  readonly isReadOnly?: boolean;
}

const IDLE_TIMEOUT_COMBOBOX_OPTIONS = [
  { value: "15", label: "15 分钟 (高灵敏安全)" },
  { value: "30", label: "30 分钟 (推荐标准)" },
  { value: "60", label: "60 分钟 (1 小时常规)" },
  { value: "480", label: "480 分钟 (8 小时工作日免登)" },
];

/**
 * 租户安全策略配置面板组件
 * 纯受控 data 契约，Combobox 全面升级，PageShell 统一外壳
 */
export function SecuritySettingsView({
  data: explicitData,
  initialData,
  isReadOnly = false,
}: SecuritySettingsViewProps) {
  const data = explicitData ?? initialData!;
  const [formData, setFormData] = useState<UpdateSecuritySettingsSchemaInput>({
    sessionIdleTimeoutMinutes: data.sessionIdleTimeoutMinutes ?? 60,
    forceChangeInitialPassword: data.forceChangeInitialPassword ?? true,
    passwordMinLength: data.passwordMinLength ?? 8,
    requireSpecialChar: data.requireSpecialChar ?? true,
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
        toast.success("租户安全策略已成功更新并生效");
        setFeedback({
          type: "success",
          message: "租户安全策略已成功更新并生效",
        });
      } else {
        toast.error(res.error || "保存安全策略失败，请稍后重试");
        setFeedback({
          type: "error",
          message: res.error || "保存安全策略失败，请稍后重试",
        });
      }
    });
  };

  return (
    <PageShell
      title="企业安全设置"
      description="管控租户会话空闲登出超时、初始密码改密强制规则以及成员账号强度基线"
      icon={<ShieldCheck className="size-5 text-blue-600 dark:text-blue-400" />}
      feedback={feedback}
      onDismissFeedback={() => setFeedback(null)}
      contentClassName="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                闲置自动登出超时 (分钟)
              </span>
              <Combobox
                value={String(formData.sessionIdleTimeoutMinutes ?? 60)}
                options={IDLE_TIMEOUT_COMBOBOX_OPTIONS}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    sessionIdleTimeoutMinutes: Number(val) || 60,
                  }))
                }
                placeholder="选择超时策略"
                disabled={isReadOnly || isPending}
              />
            </div>
          </CardContent>
        </Card>

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
                <Label
                  htmlFor="security-password-min-length"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  密码最小长度字符数
                </Label>
                <Input
                  id="security-password-min-length"
                  type="number"
                  min={6}
                  max={32}
                  value={Number(formData.passwordMinLength ?? 8)}
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
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="security-force-change-password"
                  checked={formData.forceChangeInitialPassword ?? true}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      forceChangeInitialPassword: checked === true,
                    }))
                  }
                  disabled={isReadOnly || isPending}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <Label
                    htmlFor="security-force-change-password"
                    className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    首次登录强制修改初始密码
                  </Label>
                  <p className="text-[11px] text-slate-400">
                    管理员直接开号分配临时密码后，员工首次登录成功时必须重置新密码方可进入系统
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="security-require-special-char"
                  checked={formData.requireSpecialChar ?? true}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      requireSpecialChar: checked === true,
                    }))
                  }
                  disabled={isReadOnly || isPending}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <Label
                    htmlFor="security-require-special-char"
                    className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    强制要求包含特殊符号
                  </Label>
                  <p className="text-[11px] text-slate-400">
                    密码必须包含数字、字母及至少一个特殊字符 (!@#$%^&* 等)
                  </p>
                </div>
              </div>
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
    </PageShell>
  );
}
