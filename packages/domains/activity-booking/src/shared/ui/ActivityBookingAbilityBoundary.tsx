"use client";

import React from "react";
import {
  TenantAbilityProvider,
  createAbilityFromSnapshot,
  type AbilitySnapshot,
} from "@base/authorization";
import { UiAbilityProvider } from "@base/ui";

export interface ActivityBookingSubjectPermissions {
  readonly actions: readonly string[];
  readonly fieldPolicies?: Readonly<Record<string, string>>;
}

export interface ActivityBookingAbilityPermissions {
  readonly subjects: Record<string, ActivityBookingSubjectPermissions>;
}

export function buildActivityBookingAbilitySnapshots(
  permissions: ActivityBookingAbilityPermissions,
): AbilitySnapshot[] {
  return Object.entries(permissions.subjects).map(([subject, perm]) => ({
    subject,
    actions: perm.actions,
    fieldPolicies: perm.fieldPolicies,
  }));
}

/**
 * 宁卫活动预约官方 CASL 边界注入组件
 */
export function ActivityBookingAbilityBoundary({
  permissions,
  children,
}: {
  readonly permissions: ActivityBookingAbilityPermissions;
  readonly children: React.ReactNode;
}) {
  const snapshots = React.useMemo(
    () => buildActivityBookingAbilitySnapshots(permissions),
    [permissions],
  );
  const ability = React.useMemo(
    () => createAbilityFromSnapshot(snapshots),
    [snapshots],
  );

  return (
    <TenantAbilityProvider snapshots={snapshots}>
      <UiAbilityProvider ability={ability}>{children}</UiAbilityProvider>
    </TenantAbilityProvider>
  );
}
