"use client";

import React, { useState } from "react";
import type { ProvisionTenantInput } from "../types";
import {
  X,
  PlusCircle,
  Database,
  Building2,
  Mail,
  User,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export interface ProvisionTenantDialogProps {
  /** 弹窗是否开启 */
  readonly isOpen: boolean;
  /** 是否正在执行开通与迁移 */
  readonly isPending: boolean;
  /** 关闭弹窗回调 */
  readonly onClose: () => void;
  /** 提交开通租户表单回调 */
  readonly onSubmit: (input: ProvisionTenantInput) => void;
}

/**
 * 开通新租户与独立物理库对话框组件 (遵循现代轻量工业数智风)
 * 纯白大圆角浮动卡片、科技皇家蓝主色、实时物理数据库名预览与平滑表单校验
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
  const [clusterCode] = useState("primary");

  if (!isOpen) return null;

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      slug,
      adminEmail,
      adminName,
      clusterCode,
    });
  };

  const dbNamePreview = slug
    ? `tenant_${slug.replace(/[^a-z0-9_]/g, "_")}`
    : "tenant_[slug]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="max-w-md w-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        {/* 对话框头部 */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <PlusCircle className="size-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                开通新租户与物理数据库
              </h3>
              <p className="text-[11px] text-slate-400">
                Database-per-Tenant 自动化开通与基线迁移
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
              <Building2 className="size-3.5 text-slate-400" />
              <span>租户企业全称 *</span>
            </label>
            <input
              type="text"
              required
              placeholder="例如: 杭州宸润食品工业集团"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
              <Database className="size-3.5 text-slate-400" />
              <span>租户 Slug (唯一标识 / 库名前缀) *</span>
            </label>
            <input
              type="text"
              required
              pattern="^[a-z0-9_-]{2,32}$"
              placeholder="例如: chenrun_hz (小写字母数字下划线)"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            {/* 实时物理库名提示卡片 */}
            <div className="mt-2 rounded-lg bg-blue-50/60 p-2.5 border border-blue-100/70 text-[11px] text-slate-500 flex items-start gap-2">
              <CheckCircle2 className="size-3.5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <span>将自动在 PostgreSQL 创建物理独立库：</span>
                <span className="block font-mono font-bold text-blue-700 mt-0.5">
                  {dbNamePreview}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
              <Mail className="size-3.5 text-slate-400" />
              <span>初始管理员邮箱 (Tenant Owner) *</span>
            </label>
            <input
              type="email"
              required
              placeholder="admin@tenant.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
              <User className="size-3.5 text-slate-400" />
              <span>初始管理员姓名</span>
            </label>
            <input
              type="text"
              placeholder="例如: 张三"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* 底部按钮区 */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              <span>{isPending ? "自动化开通与迁移中..." : "确认开通"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
