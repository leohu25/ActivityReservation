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
import { Sliders, Save, CheckCircle2, AlertCircle } from "lucide-react";
import type { GeneralSettingsData, UpdateGeneralSettingsInput } from "../types";
import { updateGeneralSettingsAction } from "../actions";

export interface GeneralSettingsViewProps {
  readonly initialData: GeneralSettingsData;
  readonly isReadOnly?: boolean;
}

/**
 * 租户通用基础偏好设置面板组件 (现代化表单设计)
 */
export function GeneralSettingsView({
  initialData,
  isReadOnly = false,
}: GeneralSettingsViewProps) {
  const [formData, setFormData] = useState<UpdateGeneralSettingsInput>({
    systemName: initialData.systemName || "宸润数智 ERP",
    defaultPageSize: initialData.defaultPageSize || 10,
    orderPrefix: initialData.orderPrefix || "PO-",
    dateFormat: initialData.dateFormat || "YYYY-MM-DD",
    amountPrecision: initialData.amountPrecision ?? 2,
  });

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const res = await updateGeneralSettingsAction(formData);
      if (res.success) {
        setFeedback({ type: "success", message: "基础设置偏好已成功更新" });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "保存失败，请稍后重试",
        });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 顶部标题 */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Sliders className="size-5 text-blue-600 dark:text-blue-400" />
          <span>基础偏好设置</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          自定义租户系统的显示标识、默认分页大小、单据编码规则与数值展示精度
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
        {/* 系统标识与界面偏好 */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs dark:border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
              界面与标识
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              定制化顶部导航与数据展示首选项
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                系统显示标题
              </label>
              <Input
                value={formData.systemName || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    systemName: e.target.value,
                  }))
                }
                placeholder="例如：宸润数智供应链协同系统"
                disabled={isReadOnly || isPending}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                默认分页大小 (行/页)
              </label>
              <select
                value={formData.defaultPageSize ?? 10}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    defaultPageSize: Number(e.target.value),
                  }))
                }
                disabled={isReadOnly || isPending}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value={10}>10 行 / 页</option>
                <option value={20}>20 行 / 页</option>
                <option value={50}>50 行 / 页</option>
                <option value={100}>100 行 / 页</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* 业务规则与数据格式 */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs dark:border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
              单据规则与格式
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              控制自动生成的单据编号前缀与金额格式化精度
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                采购单据编号前缀
              </label>
              <Input
                value={formData.orderPrefix || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    orderPrefix: e.target.value,
                  }))
                }
                placeholder="PO-"
                disabled={isReadOnly || isPending}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                日期默认格式
              </label>
              <Input
                value={formData.dateFormat || "YYYY-MM-DD"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dateFormat: e.target.value,
                  }))
                }
                placeholder="YYYY-MM-DD"
                disabled={isReadOnly || isPending}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                金额小数保留位数
              </label>
              <select
                value={formData.amountPrecision ?? 2}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    amountPrecision: Number(e.target.value),
                  }))
                }
                disabled={isReadOnly || isPending}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value={0}>0 位 (整数)</option>
                <option value={2}>2 位 (常规元角分)</option>
                <option value={3}>3 位 (高精成本)</option>
                <option value={4}>4 位 (超精密算)</option>
              </select>
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
              <span>{isPending ? "正在保存..." : "保存基础设置"}</span>
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
