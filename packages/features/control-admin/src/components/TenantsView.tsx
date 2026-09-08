"use client";

import React, { useState, useTransition } from "react";
import { ProvisionTenantDialog } from "./ProvisionTenantDialog";
import { TenantLifecycleTable } from "./TenantLifecycleTable";
import type { ControlTenantItem, ProvisionTenantInput } from "../types";
import { provisionTenantAction, toggleTenantStatusAction } from "../actions";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export interface TenantsViewProps {
  /** 租户列表及其物理库生命周期状态 */
  readonly tenants: readonly ControlTenantItem[];
}

/**
 * 控制平面租户运维管控交互视图组件 (遵循现代轻量工业数智风)
 * 纯白浮动大圆角卡片、平滑过渡动画与清晰的状态消息反馈
 */
export function TenantsView({ tenants }: TenantsViewProps): React.JSX.Element {
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
          text: `租户 [${input.name}] 开通成功！已自动分配独立物理库 [${res.data?.databaseName}] 并完成基线迁移。`,
        });
        setIsModalOpen(false);
      } else {
        setMessage({
          type: "error",
          text: res.error || "开通失败，请检查参数与集群状态",
        });
      }
    });
  };

  const handleToggleStatus = (orgId: string, currentStatus: string) => {
    const actionDesc = currentStatus === "ACTIVE" ? "挂起管控" : "恢复正常";
    if (!window.confirm(`确定要在控制平面${actionDesc}该租户吗？`)) {
      return;
    }

    startTransition(async () => {
      const res = await toggleTenantStatusAction(orgId);
      if (res.success) {
        setMessage({
          type: "success",
          text: `租户状态已平滑更新为: ${res.status}`,
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
    <div className="space-y-6">
      {/* 提示消息通知浮条 */}
      {message && (
        <div
          className={`flex items-start justify-between gap-3 rounded-2xl border p-4 text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top-2 duration-200 ${
            message.type === "success"
              ? "border-emerald-200/80 bg-emerald-50 text-emerald-800"
              : "border-rose-200/80 bg-rose-50 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {message.type === "success" ? (
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="size-4 text-rose-600 shrink-0" />
            )}
            <span className="leading-relaxed">{message.text}</span>
          </div>

          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
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
