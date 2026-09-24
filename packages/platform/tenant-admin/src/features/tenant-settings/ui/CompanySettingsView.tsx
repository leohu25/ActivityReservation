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
  AuthGuard,
  toast,
} from "@base/ui";
import { Settings, Save, CheckCircle2, AlertCircle, Image as ImageIcon } from "lucide-react";
import { CompanyProfileSubject } from "../company-settings.contract";
import type { CompanyProfileData } from "../types";
import type { UpdateCompanyProfileSchemaInput } from "../schema";
import { updateCompanyProfileAction } from "../actions";
import { getUploadPresignedUrlAction } from "../../attachment/actions";
import { ImageUpload } from "@base/ui";

export interface CompanySettingsViewProps {
  readonly data: CompanyProfileData;
  readonly isReadOnly?: boolean;
}

/**
 * 基础设施与企业设置面板：系统名称、Logo 更换、企业核心资料统一维护。
 */
export function CompanySettingsView({
  data,
  isReadOnly = false,
}: CompanySettingsViewProps) {
  const [formData, setFormData] = useState<UpdateCompanyProfileSchemaInput>({
    systemName: data.systemName || "企业数字化协同平台",
    logoUrl: data.logoUrl || "",
    companyName: data.companyName || "",
    shortName: data.shortName || "",
    creditCode: data.creditCode || "",
    legalPerson: data.legalPerson || "",
    contactPhone: data.contactPhone || "",
    contactEmail: data.contactEmail || "",
    address: data.address || "",
  });

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleChange = (
    field: keyof UpdateCompanyProfileSchemaInput,
    value: string | null,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (feedback) setFeedback(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      setFeedback({ type: "error", message: "企业全称为必填项" });
      return;
    }
    if (!formData.systemName?.trim()) {
      setFeedback({ type: "error", message: "系统显示名称为必填项" });
      return;
    }

    startTransition(async () => {
      const res = await updateCompanyProfileAction(formData);
      if (res.success) {
        toast.success("基础设施与企业配置已保存并生效");
        setFeedback({ type: "success", message: "基础设施与企业配置已保存并生效" });
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
            <Settings className="size-5 text-blue-600 dark:text-blue-400" />
            <span>基础设施配置</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            维护系统左上角品牌标识 (名称与 Logo) 及当前租户的核心企业主体信息
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
        {/* 系统品牌与标识区块 */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs dark:border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <ImageIcon className="size-4 text-blue-600 dark:text-blue-400" />
              <span>系统外观与品牌标识</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              设置系统左上角顶栏展示的系统名称与品牌 Logo
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <AuthorizedField
                subject="CompanyProfile"
                field="systemName"
                action={StandardAction.UPDATE}
                mode={isReadOnly ? FieldPolicy.READONLY : undefined}
                label="左上角系统显示名称 *"
              >
                <Input
                  value={formData.systemName || ""}
                  onChange={(e) => handleChange("systemName", e.target.value)}
                  placeholder="例如：示范数字化协同管理系统"
                  disabled={isPending}
                  required
                />
              </AuthorizedField>
              <p className="text-[11px] text-muted-foreground">
                保存后将立即更新全系统顶部栏的系统名称展示。
              </p>
            </div>

            <div>
              <AuthorizedField
                subject="CompanyProfile"
                field="logoUrl"
                action={StandardAction.UPDATE}
                mode={isReadOnly ? FieldPolicy.READONLY : undefined}
                label="系统 Logo 图标"
              >
                <div className="pt-1">
                  <ImageUpload
                    value={formData.logoUrl}
                    onChange={(url) => handleChange("logoUrl", url)}
                    disabled={isReadOnly || isPending}
                    module="company-logo"
                    onUploadAction={getUploadPresignedUrlAction}
                    maxSizeMB={5}
                  />
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    推荐尺寸 128x128 像素或矢量透明背景图，将展示在顶部栏左上角。
                  </div>
                </div>
              </AuthorizedField>
            </div>
          </CardContent>
        </Card>

        {/* 基础身份区块 */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs dark:border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
              企业主体资料
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              维护企业法定主体信息与社会信用凭证
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

        {!isReadOnly && (
          <div className="flex justify-end pt-2">
            <AuthGuard action={StandardAction.UPDATE} subject={CompanyProfileSubject}>
              <Button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                <Save className="size-4" />
                <span>{isPending ? "正在保存..." : "保存配置"}</span>
              </Button>
            </AuthGuard>
          </div>
        )}
      </form>
    </div>
  );
}
