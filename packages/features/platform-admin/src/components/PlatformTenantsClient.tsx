"use client";

import React, { useState, useTransition } from "react";
import { ProvisionTenantDialog } from "./ProvisionTenantDialog";
import { TenantLifecycleTable } from "./TenantLifecycleTable";
import type { PlatformTenantItem, ProvisionTenantInput } from "../types";
import { provisionTenantAction, toggleTenantStatusAction } from "../actions";

export interface PlatformTenantsClientProps {
  /** 租户列表及其物理库生命周期状态 */
  readonly tenants: readonly PlatformTenantItem[];
}

/**
 * 平台租户运维中心交互视图组件
 */
export function PlatformTenantsClient({
  tenants,
}: PlatformTenantsClientProps): React.JSX.Element {
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
          className={`rounded-xl border p-4 text-sm font-medium ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
              : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 租户生命周期管控表格 */}
      <TenantLifecycleTable
        tenants={tenants}
        isPending={isPending}
        onOpenProvision={handleOpenModal}
        onToggleStatus={handleToggleStatus}
      />

      {/* 开通租户弹窗 */}
      <ProvisionTenantDialog
        isOpen={isModalOpen}
        isPending={isPending}
        onClose={handleCloseModal}
        onSubmit={handleSubmitProvision}
      />
    </div>
  );
}
