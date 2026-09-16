"use client";

import React from "react";
import {
  TenantAbilityProvider,
  createAbilityFromSnapshot,
  type AbilitySnapshot,
} from "@base/authorization";
import { UiAbilityProvider } from "@base/ui";

export interface TenantAdminSubjectPermissions {
  readonly actions: readonly string[];
  readonly fieldPolicies?: Readonly<Record<string, string>>;
}

export interface TenantAdminAbilityPermissions {
  /** key 为 Subject（如 CompanyProfile / RoleManagement / Employee…） */
  readonly subjects: Record<string, TenantAdminSubjectPermissions>;
}

export function buildTenantAdminAbilitySnapshots(
  permissions: TenantAdminAbilityPermissions,
): AbilitySnapshot[] {
  return Object.entries(permissions.subjects).map(([subject, perm]) => ({
    subject,
    actions: perm.actions,
    fieldPolicies: perm.fieldPolicies,
  }));
}

/**
 * 租户管理官方 CASL 边界：settings / organization 等 layout 一次注入。
 */
export function TenantAdminAbilityBoundary({
  permissions,
  children,
}: {
  readonly permissions: TenantAdminAbilityPermissions;
  readonly children: React.ReactNode;
}) {
  const snapshots = React.useMemo(
    () => buildTenantAdminAbilitySnapshots(permissions),
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
