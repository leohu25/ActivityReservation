"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth/client";

interface OrgItem {
  id: string;
  name: string;
  slug: string;
}

interface OrgSwitcherProps {
  readonly activeOrgId?: string | null;
  readonly onOrgChanged?: () => void;
}

/**
 * 租户(Organization)切换与创建组件
 */
export function OrgSwitcher({ activeOrgId, onOrgChanged }: OrgSwitcherProps) {
  const { data: orgListData, isPending } = authClient.useListOrganizations();
  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [loading, setLoading] = useState(false);

  const orgList = (orgListData ?? []) as unknown as OrgItem[];

  const handleSelectOrg = async (orgId: string) => {
    if (orgId === activeOrgId) return;
    setLoading(true);
    try {
      await authClient.organization.setActive({
        organizationId: orgId,
      });
      onOrgChanged?.();
      window.location.reload();
    } catch {
      // 异常拦截
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setLoading(true);
    try {
      const res = await authClient.organization.create({
        name: newOrgName.trim(),
        slug: newOrgName.trim().toLowerCase().replace(/\s+/g, "-"),
      });
      if (res.data) {
        await authClient.organization.setActive({
          organizationId: res.data.id,
        });
        setIsCreating(false);
        setNewOrgName("");
        onOrgChanged?.();
        window.location.reload();
      }
    } catch {
      // 异常防御
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return <div className="text-xs text-zinc-400">加载租户中...</div>;
  }

  const activeOrg = orgList.find((o) => o.id === activeOrgId);

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          当前组织:
        </span>
        <select
          value={activeOrgId || ""}
          disabled={loading}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "__NEW__") {
              setIsCreating(true);
            } else if (val) {
              handleSelectOrg(val);
            }
          }}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-xs focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
        >
          {activeOrg ? (
            <option value={activeOrg.id}>{activeOrg.name}</option>
          ) : (
            <option value="">未选择组织</option>
          )}
          {orgList
            .filter((o) => o.id !== activeOrgId)
            .map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          <option value="__NEW__">+ 新建组织/租户...</option>
        </select>
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              新建 ERP 租户组织
            </h3>
            <form onSubmit={handleCreateOrg} className="mt-4 space-y-4">
              <input
                type="text"
                required
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="例如：晨润华东分部"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="rounded-lg px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {loading ? "创建中..." : "确认创建"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
