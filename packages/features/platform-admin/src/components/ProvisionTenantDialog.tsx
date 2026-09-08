"use client";

import React, { useState } from "react";
import type { ProvisionTenantInput } from "../types";

export interface ProvisionTenantDialogProps {
  readonly isOpen: boolean;
  readonly isPending: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: ProvisionTenantInput) => void;
}

/**
 * 开通新租户表单对话框组件
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
  const [clusterCode, setClusterCode] = useState("primary");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      slug,
      adminEmail,
      adminName,
      clusterCode,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="max-w-md w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            开通新租户与独立物理库
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              租户组织全称 *
            </label>
            <input
              type="text"
              required
              placeholder="例如: 杭州晨润物流集团"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              租户 Slug (唯一标识 / 库名前缀) *
            </label>
            <input
              type="text"
              required
              pattern="^[a-z0-9_-]{2,32}$"
              placeholder="例如: chenrun-hz (小写字母数字下划线)"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="mt-1 text-[11px] text-zinc-400">
              将自动创建 PostgreSQL 物理数据库:{" "}
              <code className="font-mono text-purple-600 dark:text-purple-400">
                tenant_{slug.replace(/-/g, "_") || "xxx"}
              </code>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              初始管理员邮箱 (Owner) *
            </label>
            <input
              type="email"
              required
              placeholder="admin@tenant.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              初始管理员姓名
            </label>
            <input
              type="text"
              placeholder="张三"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-500 disabled:opacity-50"
            >
              {isPending ? "自动化开通与迁移中..." : "确认开通"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
