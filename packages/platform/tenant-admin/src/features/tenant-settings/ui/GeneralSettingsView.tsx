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
  Label,
  PageShell,
  Combobox,
  toast,
} from "@base/ui";
import { Sliders, Save } from "lucide-react";
import type { GeneralSettingsData } from "../types";
import type { UpdateGeneralSettingsSchemaInput } from "../schema";
import { updateGeneralSettingsAction } from "../actions";

export interface GeneralSettingsViewProps {
  readonly data: GeneralSettingsData;
  /** @deprecated 请直接使用 data */
  readonly initialData?: GeneralSettingsData;
  readonly isReadOnly?: boolean;
}

const PAGE_SIZE_COMBOBOX_OPTIONS = [
  { value: "10", label: "10 行 / 页" },
  { value: "20", label: "20 行 / 页" },
  { value: "50", label: "50 行 / 页" },
  { value: "100", label: "100 行 / 页" },
];

const PRECISION_COMBOBOX_OPTIONS = [
  { value: "0", label: "0 位 (整数)" },
  { value: "2", label: "2 位 (常规元角分)" },
  { value: "3", label: "3 位 (高精成本)" },
  { value: "4", label: "4 位 (超精密算)" },
];

/**
 * 租户通用基础偏好设置面板组件
 * 纯受控 data 契约，Combobox 全面升级，PageShell 统一外壳
 */
export function GeneralSettingsView({
  data: explicitData,
  initialData,
  isReadOnly = false,
}: GeneralSettingsViewProps) {
  const data = explicitData ?? initialData!;
  const [formData, setFormData] = useState<UpdateGeneralSettingsSchemaInput>({
    systemName: data.systemName || "宸润数智 ERP",
    defaultPageSize: data.defaultPageSize || 10,
    orderPrefix: data.orderPrefix || "PO-",
    dateFormat: data.dateFormat || "YYYY-MM-DD",
    amountPrecision: data.amountPrecision ?? 2,
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
        toast.success("基础设置偏好已成功更新");
        setFeedback({ type: "success", message: "基础设置偏好已成功更新" });
      } else {
        toast.error(res.error || "保存失败，请稍后重试");
        setFeedback({
          type: "error",
          message: res.error || "保存失败，请稍后重试",
        });
      }
    });
  };

  return (
    <PageShell
      title="基础偏好设置"
      description="自定义租户系统的显示标识、默认分页大小、单据编码规则与数值展示精度"
      icon={<Sliders className="size-5 text-blue-600 dark:text-blue-400" />}
      feedback={feedback}
      onDismissFeedback={() => setFeedback(null)}
      contentClassName="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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
              <Label
                htmlFor="general-system-name"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                系统显示标题
              </Label>
              <Input
                id="general-system-name"
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
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                默认分页大小 (行/页)
              </span>
              <Combobox
                value={String(formData.defaultPageSize ?? 10)}
                options={PAGE_SIZE_COMBOBOX_OPTIONS}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    defaultPageSize: Number(val) || 10,
                  }))
                }
                placeholder="选择分页大小"
                disabled={isReadOnly || isPending}
              />
            </div>
          </CardContent>
        </Card>

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
              <Label
                htmlFor="general-order-prefix"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                采购单据编号前缀
              </Label>
              <Input
                id="general-order-prefix"
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
              <Label
                htmlFor="general-date-format"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                日期默认格式
              </Label>
              <Input
                id="general-date-format"
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
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                金额小数保留位数
              </span>
              <Combobox
                value={String(formData.amountPrecision ?? 2)}
                options={PRECISION_COMBOBOX_OPTIONS}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    amountPrecision: val !== null ? Number(val) : 2,
                  }))
                }
                placeholder="选择精度"
                disabled={isReadOnly || isPending}
              />
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
    </PageShell>
  );
}
