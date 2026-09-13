import React from "react";
import {
  TenantAbilityProvider,
  type AbilitySnapshot,
} from "@base/authorization";
import { SalesOrderSubject } from "../../features/sales-order/contract";

export interface OrderAbilityPermissions {
  readonly salesOrder: {
    readonly actions: readonly string[];
    readonly fieldPolicies?: Readonly<Record<string, string>>;
  };
}

export function buildOrderAbilitySnapshots(
  permissions: OrderAbilityPermissions,
): AbilitySnapshot[] {
  return [
    {
      subject: SalesOrderSubject,
      actions: permissions.salesOrder.actions,
      fieldPolicies: permissions.salesOrder.fieldPolicies,
    },
  ];
}

export function OrderAbilityBoundary({
  permissions,
  children,
}: {
  readonly permissions: OrderAbilityPermissions;
  readonly children: React.ReactNode;
}) {
  const snapshots = React.useMemo(
    () => buildOrderAbilitySnapshots(permissions),
    [permissions],
  );

  return (
    <TenantAbilityProvider snapshots={snapshots}>
      {children}
    </TenantAbilityProvider>
  );
}
