"use client";

import React, { useState, useTransition } from "react";
import { ProvisionTenantDialog } from "./ProvisionTenantDialog";
import { TenantLifecycleTable } from "./TenantLifecycleTable";
import { TenantDetailDrawer } from "./TenantDetailDrawer";
import type {
  ControlTenantItem,
  ControlTenantDetail,
  ProvisionTenantInput,
  ProvisionTenantResult,
} from "../types";
import {
  provisionTenantAction,
  toggleTenantStatusAction,
  getTenantDetailAction,
} from "../actions";
import { toast, ConfirmDialog } from "@base/ui";

export interface TenantsViewProps {
  /** 租户列表及其物理库生命周期状态 */
  readonly tenants: readonly ControlTenantItem[];
}

/**
 * 控制平面租户运维管控交互视图组件
 * 严格遵循工程红线：
 * 1. 杜绝 window.confirm，使用模态确认弹窗
 * 2. 杜绝静态大横幅，所有通知统一右上角 toast
 */
export function TenantsView({ tenants }: TenantsViewProps): React.JSX.Element {
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedTenantDetail, setSelectedTenantDetail] =
    useState<ControlTenantDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // 挂起/恢复确认弹窗状态
  const [confirmToggleTarget, setConfirmToggleTarget] = useState<{
    orgId: string;
    actionDesc: string;
  } | null>(null);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const loadTenantDetail = (orgId: string, page = 1, search = "") => {
    setIsDetailLoading(true);
    startTransition(async () => {
      const res = await getTenantDetailAction(orgId, {
        page,
        pageSize: 8,
        search,
      });
      setIsDetailLoading(false);
      if (res.success && res.data) {
        setSelectedTenantDetail(res.data);
      } else {
        toast.error(res.error || "获取租户详情失败");
      }
    });
  };

  const handleOpenDetail = (orgId: string) => {
    setSelectedOrgId(orgId);
    setIsDrawerOpen(true);
    setSelectedTenantDetail(null);
    loadTenantDetail(orgId, 1, "");
  };

  const handleFetchMembers = (page: number, search: string) => {
    if (!selectedOrgId) return;
    loadTenantDetail(selectedOrgId, page, search);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedOrgId(null);
    setSelectedTenantDetail(null);
  };

  const handleSubmitProvision = async (
    input: ProvisionTenantInput,
  ): Promise<ProvisionTenantResult | undefined> => {
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
    if (input.initialPassword) {
      formData.append("initialPassword", input.initialPassword);
    }

    let returnedResult: ProvisionTenantResult | undefined;
    await new Promise<void>((resolve) => {
      startTransition(async () => {
        const res = await provisionTenantAction(formData);
        if (res.success && res.data) {
          returnedResult = res.data;
          toast.success(
            `租户 [${input.name}] 开通成功！已自动分配独立物理库 [${res.data.databaseName}]。`,
          );
        } else {
          toast.error(res.error || "开通失败，请检查参数与集群状态");
        }
        resolve();
      });
    });

    return returnedResult;
  };

  const handleTriggerToggleStatus = (orgId: string, currentStatus: string) => {
    const actionDesc = currentStatus === "ACTIVE" ? "挂起管控" : "恢复正常";
    setConfirmToggleTarget({ orgId, actionDesc });
  };

  const handleConfirmToggle = () => {
    if (!confirmToggleTarget) return;
    const { orgId, actionDesc } = confirmToggleTarget;
    setConfirmToggleTarget(null);

    startTransition(async () => {
      const res = await toggleTenantStatusAction(orgId);
      if (res.success) {
        toast.success(`租户已平滑更新为: ${res.status}`);
      } else {
        toast.error(res.error || `${actionDesc}操作失败`);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 租户生命周期管控表格 */}
      <TenantLifecycleTable
        tenants={tenants}
        isPending={isPending}
        onOpenProvision={handleOpenModal}
        onToggleStatus={handleTriggerToggleStatus}
        onOpenDetail={handleOpenDetail}
      />

      {/* 租户全景详情与成员抽屉 */}
      <TenantDetailDrawer
        isOpen={isDrawerOpen}
        tenantDetail={selectedTenantDetail}
        isLoading={isDetailLoading}
        onClose={handleCloseDrawer}
        onFetchMembers={handleFetchMembers}
      />

      {/* 开通租户弹窗 */}
      <ProvisionTenantDialog
        isOpen={isModalOpen}
        isPending={isPending}
        onClose={handleCloseModal}
        onSubmit={handleSubmitProvision}
      />

      {/* 状态启停模态确认弹窗 (ConfirmDialog 替代原生 window.confirm) */}
      <ConfirmDialog
        open={Boolean(confirmToggleTarget)}
        onOpenChange={(open) => {
          if (!open) setConfirmToggleTarget(null);
        }}
        title={`确认${confirmToggleTarget?.actionDesc || ""}租户？`}
        description={
          confirmToggleTarget?.actionDesc === "挂起管控"
            ? "挂起后该租户的物理数据库连接池将立即被阻断，租户端用户将被拦截写入，是否确认？"
            : "恢复正常后将重新允许该租户的业务请求接入与路由，是否确认？"
        }
        confirmText={`确认${confirmToggleTarget?.actionDesc || ""}`}
        onConfirm={async () => {
          handleConfirmToggle();
        }}
      />
    </div>
  );
}
