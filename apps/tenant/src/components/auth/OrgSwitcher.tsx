"use client";

import React, { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { authClient } from "@/lib/auth/client";
import { Button, Input } from "@chenrun/ui";

interface OrgItem {
  id: string;
  name: string;
  slug: string;
}

interface OrgSwitcherProps {
  readonly activeOrgId?: string | null;
  readonly onOrgChanged?: () => void;
}

const emptySubscribe = () => () => {};

/**
 * 租户(Organization)切换与创建组件
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

  // 使用 useSyncExternalStore 安全判断客户端注水，消除 useEffect 中的 setState 级联渲染警告
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
      // 英文数字转 slug，若全中文则生成唯一安全 slug
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
    return <div className="text-xs text-zinc-400">加载租户中...</div>;
  }

  const activeOrg = orgList.find((o) => o.id === activeOrgId);

  // 模态框通过 React Portal 直接挂载到 document.body，彻底脱离任何相对定位/变换容器
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
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  ✕
                </button>
              </div>

              {error && (
                <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateOrg} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    租户企业 / 分部名称
                  </label>
                  <Input
                    type="text"
                    required
                    autoFocus
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="例如：晨润华东分部"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
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
                    {loading ? "创建激活中..." : "确认创建"}
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )
      : null;

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
              setError(null);
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

      {modalElement}
    </div>
  );
}
