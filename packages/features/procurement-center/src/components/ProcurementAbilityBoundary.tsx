"use client";

import React from "react";
import {
  TenantAbilityProvider,
  type AbilitySnapshot,
} from "@base/authorization";
import { ProcurementOrderSubject } from "../contracts";

export interface ProcurementAbilityPermissions {
  readonly order: {
    readonly actions: readonly string[];
    readonly fieldPolicies?: Readonly<Record<string, string>>;
  };
}

export function buildProcurementAbilitySnapshots(
  permissions: ProcurementAbilityPermissions,
): AbilitySnapshot[] {
  return [
    {
      subject: ProcurementOrderSubject,
      actions: permissions.order.actions,
      fieldPolicies: permissions.order.fieldPolicies,
    },
  ];
}

/** 采购中心官方 CASL 边界：layout 注入，View 只 useAbility */
export function ProcurementAbilityBoundary({
  permissions,
  children,
}: {
  readonly permissions: ProcurementAbilityPermissions;
  readonly children: React.ReactNode;
}) {
  const snapshots = React.useMemo(
    () => buildProcurementAbilitySnapshots(permissions),
    [permissions],
  );

  return (
    <TenantAbilityProvider snapshots={snapshots}>
      {children}
    </TenantAbilityProvider>
  );
}
