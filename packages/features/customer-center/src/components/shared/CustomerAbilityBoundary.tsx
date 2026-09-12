import React from "react";
import {
  TenantAbilityProvider,
  type AbilitySnapshot,
} from "@chenrun/authorization";
import {
  CustomerCategorySubject,
  CustomerQuoteSubject,
  CustomerStoreSubject,
  CustomerSubject,
  CustomerTagSubject,
} from "../../contracts";

/** 客户中心各 Subject 的 RSC 权限纯数据 */
export interface CustomerAbilityPermissions {
  readonly customer: {
    readonly actions: readonly string[];
    readonly fieldPolicies?: Readonly<Record<string, string>>;
  };
  readonly store: {
    readonly actions: readonly string[];
    readonly fieldPolicies?: Readonly<Record<string, string>>;
  };
  readonly quote: {
    readonly actions: readonly string[];
    readonly fieldPolicies?: Readonly<Record<string, string>>;
  };
  readonly category: {
    readonly actions: readonly string[];
    readonly fieldPolicies?: Readonly<Record<string, string>>;
  };
  readonly tag: {
    readonly actions: readonly string[];
    readonly fieldPolicies?: Readonly<Record<string, string>>;
  };
}

/** 将客户中心多 Subject 权限编译为官方 Ability 快照列表 */
export function buildCustomerAbilitySnapshots(
  permissions: CustomerAbilityPermissions,
): AbilitySnapshot[] {
  return [
    {
      subject: CustomerSubject,
      actions: permissions.customer.actions,
      fieldPolicies: permissions.customer.fieldPolicies,
    },
    {
      subject: CustomerStoreSubject,
      actions: permissions.store.actions,
      fieldPolicies: permissions.store.fieldPolicies,
    },
    {
      subject: CustomerQuoteSubject,
      actions: permissions.quote.actions,
      fieldPolicies: permissions.quote.fieldPolicies,
    },
    {
      subject: CustomerCategorySubject,
      actions: permissions.category.actions,
      fieldPolicies: permissions.category.fieldPolicies,
    },
    {
      subject: CustomerTagSubject,
      actions: permissions.tag.actions,
      fieldPolicies: permissions.tag.fieldPolicies,
    },
  ];
}

/**
 * 客户中心官方 CASL 边界：layout 一次注入，子树统一 AbilityProvider。
 * 页面/View 禁止再传 ability/permissions，只声明 subject。
 */
export function CustomerAbilityBoundary({
  permissions,
  children,
}: {
  readonly permissions: CustomerAbilityPermissions;
  readonly children: React.ReactNode;
}) {
  const snapshots = React.useMemo(
    () => buildCustomerAbilitySnapshots(permissions),
    [permissions],
  );

  return (
    <TenantAbilityProvider snapshots={snapshots}>
      {children}
    </TenantAbilityProvider>
  );
}
