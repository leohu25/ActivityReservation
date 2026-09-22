"use client";

import React, { useState, useTransition } from "react";
import { FieldPolicy, StandardAction } from "@base/authorization";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Button,
  Badge,
  AuthorizedField,
  Combobox,
  toast,
} from "@base/ui";
import { Building2, Save, CheckCircle2, AlertCircle } from "lucide-react";
import type { CompanyProfileData } from "../types";
import type { UpdateCompanyProfileSchemaInput } from "../schema";
import { updateCompanyProfileAction } from "../actions";

export interface CompanySettingsViewProps {
  readonly data: CompanyProfileData;
  readonly isReadOnly?: boolean;
}

const TIMEZONE_OPTIONS = [
  { value: "Asia/Shanghai", label: "Asia/Shanghai (中国标准时间 UTC+8)" },
  { value: "Asia/Hong_Kong", label: "Asia/Hong_Kong (香港时间 UTC+8)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (东京时间 UTC+9)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (新加坡时间 UTC+8)" },
  { value: "Europe/London", label: "Europe/London (格林威治标准时间 UTC+0)" },
  { value: "America/New_York", label: "America/New_York (美东时间 UTC-5)" },
];

const CURRENCY_OPTIONS = [
  { value: "CNY", label: "CNY - 人民币 (¥)" },
  { value: "USD", label: "USD - 美元 ($)" },
  { value: "EUR", label: "EUR - 欧元 (€)" },
  { value: "HKD", label: "HKD - 港币 (HK$)" },
  { value: "JPY", label: "JPY - 日元 (¥)" },
];

/**
 * 企业资料设置面板：纯受控 data 契约，Combobox 升级，AuthorizedField 三态。
 */
export function CompanySettingsView({
  data,
  isReadOnly = false,
}: CompanySettingsViewProps) {
  const [formData, setFormData] = useState<UpdateCompanyProfileSchemaInput>({
    companyName: data.companyName || "",
    shortName: data.shortName || "",
    creditCode: data.creditCode || "",
    legalPerson: data.legalPerson || "",
    contactPhone: data.contactPhone || "",
    contactEmail: data.contactEmail || "",
    address: data.address || "",
    timezone: data.timezone || "Asia/Shanghai",
    currency: data.currency || "CNY",
  });

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleChange = (
    field: keyof UpdateCompanyProfileSchemaInput,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (feedback) setFeedback(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      setFeedback({ type: "error", message: "企业名称为必填项" });
      return;
    }

    startTransition(async () => {
      const res = await updateCompanyProfileAction(formData);
      if (res.success) {
        toast.success("企业资料已成功保存并同步");
        setFeedback({ type: "success", message: "企业资料已成功保存并同步" });
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
    <div className="space-y-6 max-w-4xl">
      {/* 顶部标题栏卡片 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="size-5 text-blue-600 dark:text-blue-400" />
            <span>企业信息管理</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            维护当前独立租户物理库中的企业主体法人、统一社会信用代码与经营联系资料
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-slate-500 font-mono text-[11px]"
          >
            {data.id ? `ID: ${data.id}` : "初始档案未固化"}
          </Badge>
        </div>
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
        {/* 基础身份区块 */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs dark:border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
              主体基础资料
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              用于开具单据抬头、合同印鉴与系统平台展示
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <AuthorizedField
              subject="CompanyProfile"
              field="companyName"
              action={StandardAction.UPDATE}
              mode={isReadOnly ? FieldPolicy.READONLY : undefined}
              label="企业法定全称 *"
            >
              <Input
                value={formData.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                placeholder="例如：示范数智工贸制造有限公司"
                disabled={isPending}
                required
              />
            </AuthorizedField>

            <AuthorizedField
              subject="CompanyProfile"
              field="shortName"
              action={StandardAction.UPDATE}
              mode={isReadOnly ? FieldPolicy.READONLY : undefined}
              label="企业品牌简称"
            >
              <Input
                value={formData.shortName || ""}
                onChange={(e) => handleChange("shortName", e.target.value)}
                placeholder="例如：数智科技"
                disabled={isPending}
              />
            </AuthorizedField>

            <AuthorizedField
              subject="CompanyProfile"
              field="creditCode"
              action={StandardAction.UPDATE}
              mode={isReadOnly ? FieldPolicy.READONLY : undefined}
              label="统一社会信用代码"
            >
              <Input
                value={formData.creditCode || ""}
                onChange={(e) => handleChange("creditCode", e.target.value)}
                placeholder="18位统一社会信用代码"
                disabled={isPending}
              />
            </AuthorizedField>

            <AuthorizedField
              subject="CompanyProfile"
              field="legalPerson"
              action={StandardAction.UPDATE}
              mode={isReadOnly ? FieldPolicy.READONLY : undefined}
              label="法定代表人 / 负责人"
            >
              <Input
                value={formData.legalPerson || ""}
                onChange={(e) => handleChange("legalPerson", e.target.value)}
                placeholder="姓名"
                disabled={isPending}
              />
            </AuthorizedField>
          </CardContent>
        </Card>

        {/* 联系与经营资料区块 */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs dark:border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
              经营与联系信息
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              用于业务单据联系人及企业地理经营定位
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <AuthorizedField
              subject="CompanyProfile"
              field="contactPhone"
              action={StandardAction.UPDATE}
              mode={isReadOnly ? FieldPolicy.READONLY : undefined}
              label="业务联系电话"
            >
              <Input
                value={formData.contactPhone || ""}
                onChange={(e) => handleChange("contactPhone", e.target.value)}
                placeholder="座机或手机号码"
                disabled={isPending}
              />
            </AuthorizedField>

            <AuthorizedField
              subject="CompanyProfile"
              field="contactEmail"
              action={StandardAction.UPDATE}
              mode={isReadOnly ? FieldPolicy.READONLY : undefined}
              label="官方联系邮箱"
            >
              <Input
                type="email"
                value={formData.contactEmail || ""}
                onChange={(e) => handleChange("contactEmail", e.target.value)}
                placeholder="contact@company.com"
                disabled={isPending}
              />
            </AuthorizedField>

            <div className="md:col-span-2">
              <AuthorizedField
                subject="CompanyProfile"
                field="address"
                action={StandardAction.UPDATE}
                mode={isReadOnly ? FieldPolicy.READONLY : undefined}
                label="经营注册地址"
              >
                <Input
                  value={formData.address || ""}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="省、市、区及详细门牌号"
                  disabled={isPending}
                />
              </AuthorizedField>
            </div>
          </CardContent>
        </Card>

        {/* 国际化与财务基准区块 */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs dark:border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
              时区与本位币种
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              决定系统业务单据时间戳显示规则与财务核算币种
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                企业业务时区
              </span>
              <Combobox
                value={formData.timezone || "Asia/Shanghai"}
                options={TIMEZONE_OPTIONS}
                onChange={(val) => handleChange("timezone", val || "Asia/Shanghai")}
                placeholder="选择业务时区"
                disabled={isReadOnly || isPending}
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                财务本位币种
              </span>
              <Combobox
                value={formData.currency || "CNY"}
                options={CURRENCY_OPTIONS}
                onChange={(val) => handleChange("currency", val || "CNY")}
                placeholder="选择财务本位币"
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
              <span>{isPending ? "正在保存..." : "保存企业信息"}</span>
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
