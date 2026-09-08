"use client";

import React, { useState, useTransition } from "react";
import { PlatformMetricsView } from "./PlatformMetricsView";
import { ProvisionTenantDialog } from "./ProvisionTenantDialog";
import { TenantLifecycleTable } from "./TenantLifecycleTable";
import type {
  PlatformAdminStats,
  PlatformTenantItem,
  ProvisionTenantInput,
} from "../types";
import { provisionTenantAction, toggleTenantStatusAction } from "../actions";

export interface PlatformConsoleClientProps {
  /** 平台运营指标统计 */
  readonly stats: PlatformAdminStats;
  /** 租户列表及其物理库生命周期状态 */
  readonly tenants: readonly PlatformTenantItem[];
}

/**
 * 平台总控控制台客户端装配组件
 * 自包含在 @chenrun/feature-platform-admin 垂直切片包内部
 */
export function PlatformConsoleClient({
  stats,
  tenants,
}: PlatformConsoleClientProps): React.JSX.Element {
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleOpenModal = () => {
    setMessage(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitProvision = (input: ProvisionTenantInput) => {
    setMessage(null);
    const formData = new FormData();
    formData.append("name", input.name);
    formData.append("slug", input.slug);
    formData.append("adminEmail", input.adminEmail);
    if (input.adminName) {
      formData.append("adminName", input.adminName);
    }
    if (input.clusterCode) {
      formData.append("clusterCode", input.clusterCode);
    }

    startTransition(async () => {
      const res = await provisionTenantAction(formData);
      if (res.success) {
        setMessage({
          type: "success",
          text: `租户 [${input.name}] 开通成功！已自动分配物理数据库 [${res.data?.databaseName}] 并完成基线迁移。`,
        });
        setIsModalOpen(false);
      } else {
        setMessage({
          type: "error",
          text: res.error || "开通失败",
        });
      }
    });
  };

  const handleToggleStatus = (orgId: string, currentStatus: string) => {
    const actionDesc = currentStatus === "ACTIVE" ? "挂起" : "激活";
    if (!window.confirm(`确定要${actionDesc}该租户吗？`)) {
      return;
    }

    startTransition(async () => {
      const res = await toggleTenantStatusAction(orgId);
      if (res.success) {
        setMessage({
          type: "success",
          text: `租户状态已变更为: ${res.status}`,
        });
      } else {
        setMessage({
          type: "error",
          text: res.error || "操作失败",
        });
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* 提示消息通知 */}
      {message && (
        <div
          className={`rounded-xl p-4 text-sm font-medium border flex items-center justify-between transition-all ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
              : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{message.type === "success" ? "✔" : "✗"}</span>
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-xs underline hover:opacity-80"
          >
            关闭
          </button>
        </div>
      )}

      {/* 核心指标看板 (FDD 垂直切片组件) */}
      <PlatformMetricsView stats={stats} />

      {/* 租户全生命周期运维表格 (FDD 垂直切片组件) */}
      <TenantLifecycleTable
        tenants={tenants}
        isPending={isPending}
        onOpenProvision={handleOpenModal}
        onToggleStatus={handleToggleStatus}
      />

      {/* 开通新租户弹窗 (FDD 垂直切片组件) */}
      <ProvisionTenantDialog
        isOpen={isModalOpen}
        isPending={isPending}
        onClose={handleCloseModal}
        onSubmit={handleSubmitProvision}
      />
    </div>
  );
}
