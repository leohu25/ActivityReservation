"use client";

import React, { useState } from "react";
import type { ProvisionTenantInput, ProvisionTenantResult } from "../types";
import {
  X,
  PlusCircle,
  Database,
  Building2,
  Mail,
  User,
  Loader2,
  CheckCircle2,
  Key,
  Copy,
  Check,
} from "lucide-react";
import { Card, Button } from "@base/ui";

export interface ProvisionTenantDialogProps {
  /** 弹窗是否开启 */
  readonly isOpen: boolean;
  /** 是否正在执行开通与迁移 */
  readonly isPending: boolean;
  /** 关闭弹窗回调 */
  readonly onClose: () => void;
  /** 提交开通租户表单回调（支持异步返回开通结果以展示凭据） */
  readonly onSubmit: (
    input: ProvisionTenantInput,
  ) => Promise<ProvisionTenantResult | undefined> | void;
}

/**
 * 开通新租户与独立物理库对话框组件
 * 完全基于 shadcn ui (Card, Button, Badge) 组合，原生适配明暗双色主题
 */
export function ProvisionTenantDialog({
  isOpen,
  isPending,
  onClose,
  onSubmit,
}: ProvisionTenantDialogProps): React.JSX.Element | null {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [initialPassword, setInitialPassword] = useState("");
  const [clusterCode] = useState("primary");
  const [successResult, setSuccessResult] =
    useState<ProvisionTenantResult | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setSuccessResult(null);
    setName("");
    setSlug("");
    setAdminEmail("");
    setAdminName("");
    setInitialPassword("");
    setCopied(false);
    onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const result = await onSubmit({
      name,
      slug,
      adminEmail,
      adminName,
      clusterCode,
      initialPassword: initialPassword.trim() || undefined,
    });
    if (result) {
      setSuccessResult(result);
    }
  };

  const dbNamePreview = slug
    ? `tenant_${slug.replace(/[^a-z0-9_]/g, "_")}`
    : "tenant_[slug]";

  // 成功状态卡片与密码凭据展示视图
  if (successResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
        <Card className="max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150 p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 border-b pb-3">
            <CheckCircle2 className="size-5" />
            <h3 className="text-base font-bold text-foreground">
              租户与物理数据库开通成功
            </h3>
          </div>

          <div className="rounded-xl bg-muted/40 p-3.5 space-y-2 text-xs border">
            <div className="flex justify-between">
              <span className="text-muted-foreground">企业全称:</span>
              <span className="font-semibold text-foreground">{name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slug 标识:</span>
              <span className="font-mono text-foreground">
                {successResult.slug}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">物理独立库:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {successResult.databaseName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Owner 账号:</span>
              <span className="font-semibold text-foreground">
                {adminEmail}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">基线数据状态:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                已自动 Seed 根部门与岗位字典
              </span>
            </div>
          </div>

          {successResult.initialPassword && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                <Key className="size-4" />
                <span>初始管理员登录密码凭据 (请妥善保存)</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                该密码仅在首次开通成功时展示，租户 Owner 可直接凭此密码登录进入
                ERP 系统。
              </p>
              <div className="flex items-center justify-between gap-2 bg-card rounded-lg border border-amber-500/20 px-3 py-2">
                <code className="font-mono text-sm font-bold text-foreground select-all">
                  {successResult.initialPassword}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (successResult.initialPassword) {
                      navigator.clipboard.writeText(
                        successResult.initialPassword,
                      );
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }
                  }}
                  className="gap-1 text-xs cursor-pointer"
                >
                  {copied ? (
                    <Check className="size-3 text-emerald-600" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  <span>{copied ? "已复制" : "复制密码"}</span>
                </Button>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <Button
              onClick={handleClose}
              className="w-full font-bold cursor-pointer"
            >
              完成并返回租户大盘
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <Card className="max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150 p-6">
        {/* 对话框头部 */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <PlusCircle className="size-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                开通新租户与物理数据库
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Database-per-Tenant 自动化开通与基线 Seed
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleClose}
            className="cursor-pointer"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* 表单主体 */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Building2 className="size-3.5 text-blue-600 dark:text-blue-400" />
              <span>租户企业全称 *</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如: 示例制造有限公司"
              className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary focus:outline-hidden transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center justify-between text-xs font-bold text-foreground">
              <span className="flex items-center gap-1.5">
                <Database className="size-3.5 text-blue-600 dark:text-blue-400" />
                <span>租户代号标识 (Slug) *</span>
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                仅小写字母数字与下划线
              </span>
            </label>
            <input
              type="text"
              required
              pattern="^[a-z0-9_-]{2,32}$"
              value={slug}
              onChange={(e) =>
                setSlug(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                )
              }
              placeholder="例如: tenant_004 或 factory_sh"
              className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary focus:outline-hidden transition-all"
            />
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
              <span>预计物理数据库名:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {dbNamePreview}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Mail className="size-3.5 text-blue-600 dark:text-blue-400" />
              <span>初始管理员邮箱 (Owner Email) *</span>
            </label>
            <input
              type="email"
              required
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@tenant.com"
              className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary focus:outline-hidden transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <User className="size-3.5 text-blue-600 dark:text-blue-400" />
              <span>初始管理员姓名 (选填)</span>
            </label>
            <input
              type="text"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="例如: 租户超级管理员"
              className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary focus:outline-hidden transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center justify-between text-xs font-bold text-foreground">
              <span className="flex items-center gap-1.5">
                <Key className="size-3.5 text-blue-600 dark:text-blue-400" />
                <span>初始登录密码 (选填，留空则生成默认强密码)</span>
              </span>
            </label>
            <input
              type="text"
              value={initialPassword}
              onChange={(e) => setInitialPassword(e.target.value)}
              placeholder="留空自动生成: Admin123456!"
              className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary focus:outline-hidden transition-all"
            />
          </div>

          {/* 底部按钮栏 */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={handleClose}
              className="cursor-pointer"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="gap-2 cursor-pointer font-bold"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>正在自动化开通与迁移...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="size-3.5" />
                  <span>立即开通</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
