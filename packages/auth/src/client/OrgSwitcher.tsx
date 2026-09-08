"use client";

import React, { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { authClient } from "../client";
import { Button, Input } from "@chenrun/ui";

interface OrgItem {
  id: string;
  name: string;
  slug: string;
}

export interface OrgSwitcherProps {
  readonly activeOrgId?: string | null;
  readonly onOrgChanged?: () => void;
}

const emptySubscribe = () => () => {};

/**
 * 租户(Organization)切换与创建客户端组件 (基于 Better Auth client)
 */
export function OrgSwitcher({ activeOrgId, onOrgChanged }: OrgSwitcherProps) {
  const {
    data: orgListData,
    isPending,
    refetch,
  } = authClient.useListOrganizations();
  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  // SAFETY: Better Auth 官方 organizationClient 插件返回包含 id, name, slug 的租户列表结构
  const orgList = (orgListData ?? []) as unknown as OrgItem[];

  const handleSelectOrg = async (orgId: string) => {
    if (orgId === activeOrgId) return;
    setLoading(true);
    setError(null);
    try {
      await authClient.organization.setActive({
        organizationId: orgId,
      });
      onOrgChanged?.();
      window.location.href = "/workbench";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "切换租户失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const trimmed = newOrgName.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const pinyinOrAscii = trimmed
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const slug = pinyinOrAscii || `org-${Date.now()}`;

      const res = await authClient.organization.create({
        name: trimmed,
        slug: slug,
      });

      if (res.error) {
        setError(res.error.message || "创建组织失败，请检查输入");
        return;
      }

      if (res.data) {
        await authClient.organization.setActive({
          organizationId: res.data.id,
        });
        setIsCreating(false);
        setNewOrgName("");
        if (refetch) {
          await refetch();
        }
        onOrgChanged?.();
        window.location.href = "/workbench";
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "创建组织发生异常，请稍后重试",
      );
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <span className="h-2 w-2 animate-ping rounded-full bg-blue-500" />
        加载租户中...
      </div>
    );
  }

  const activeOrg = orgList.find((o) => o.id === activeOrgId);

  const modalElement =
    isCreating && isMounted && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  新建 ERP 租户组织
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setError(null);
                  }}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {error && (
                <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateOrg} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    组织 / 企业名称
                  </label>
                  <Input
                    type="text"
                    required
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="例如：江苏晨润实业有限公司"
                    className="mt-1"
                  />
                  <p className="mt-1 text-[11px] text-zinc-400">
                    系统将自动生成物理数据库标识，并建立隔离的数据空间。
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsCreating(false);
                      setError(null);
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={loading || !newOrgName.trim()}
                  >
                    {loading ? "创建中..." : "立即创建"}
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="relative inline-flex items-center gap-2">
        <select
          value={activeOrgId || ""}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "__new__") {
              setIsCreating(true);
            } else if (val) {
              handleSelectOrg(val);
            }
          }}
          disabled={loading}
          className="h-9 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 pr-8 text-xs font-semibold text-zinc-800 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 cursor-pointer"
        >
          {orgList.length === 0 && <option value="">暂无租户组织</option>}
          {orgList.map((org) => (
            <option key={org.id} value={org.id}>
              🏢 {org.name} ({org.slug})
            </option>
          ))}
          <option disabled>──────────</option>
          <option value="__new__">➕ 新建企业租户...</option>
        </select>

        {activeOrg && (
          <span className="hidden md:inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400">
            活跃租户
          </span>
        )}
      </div>

      {modalElement}
    </>
  );
}
