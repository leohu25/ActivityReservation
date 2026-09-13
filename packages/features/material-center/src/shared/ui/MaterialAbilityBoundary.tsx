import React from "react";
import {
  TenantAbilityProvider,
  type AbilitySnapshot,
} from "@base/authorization";
import {
  ItemCategorySubject,
  ItemGradeSubject,
  ItemVarietySubject,
} from "../../features/classification/contract";
import {
  UnitConversionSubject,
  UnitOfMeasureSubject,
} from "../../features/unit-management/contract";
import { ItemMasterSubject } from "../../features/item-master/contract";
import {
  BomHeaderSubject,
  ProcessMasterSubject,
  ProductionLineSubject,
} from "../../features/bom-management/contract";

export interface MaterialAbilityPermissions {
  readonly category: {
    readonly actions: readonly string[];
    readonly fieldPolicies?: Readonly<Record<string, string>>;
  };
  readonly variety: {
    readonly actions: readonly string[];
    readonly fieldPolicies?: Readonly<Record<string, string>>;
  };
  readonly grade: {
    readonly actions: readonly string[];
    readonly fieldPolicies?: Readonly<Record<string, string>>;
  };
  readonly unit: {
    readonly actions: readonly string[];
    readonly fieldPolicies?: Readonly<Record<string, string>>;
  };
  readonly conversion: {
    readonly actions: readonly string[];
    readonly fieldPolicies?: Readonly<Record<string, string>>;
  };
  readonly item: {
    readonly actions: readonly string[];
    readonly fieldPolicies?: Readonly<Record<string, string>>;
  };
  readonly bom: {
    readonly actions: readonly string[];
    readonly fieldPolicies?: Readonly<Record<string, string>>;
  };
  readonly process: {
    readonly actions: readonly string[];
    readonly fieldPolicies?: Readonly<Record<string, string>>;
  };
  readonly productionLine: {
    readonly actions: readonly string[];
    readonly fieldPolicies?: Readonly<Record<string, string>>;
  };
}

export function buildMaterialAbilitySnapshots(
  permissions: MaterialAbilityPermissions,
): AbilitySnapshot[] {
  return [
    {
      subject: ItemCategorySubject,
      actions: permissions.category.actions,
      fieldPolicies: permissions.category.fieldPolicies,
    },
    {
      subject: ItemVarietySubject,
      actions: permissions.variety.actions,
      fieldPolicies: permissions.variety.fieldPolicies,
    },
    {
      subject: ItemGradeSubject,
      actions: permissions.grade.actions,
      fieldPolicies: permissions.grade.fieldPolicies,
    },
    {
      subject: UnitOfMeasureSubject,
      actions: permissions.unit.actions,
      fieldPolicies: permissions.unit.fieldPolicies,
    },
    {
      subject: UnitConversionSubject,
      actions: permissions.conversion.actions,
      fieldPolicies: permissions.conversion.fieldPolicies,
    },
    {
      subject: ItemMasterSubject,
      actions: permissions.item.actions,
      fieldPolicies: permissions.item.fieldPolicies,
    },
    {
      subject: BomHeaderSubject,
      actions: permissions.bom.actions,
      fieldPolicies: permissions.bom.fieldPolicies,
    },
    {
      subject: ProcessMasterSubject,
      actions: permissions.process.actions,
      fieldPolicies: permissions.process.fieldPolicies,
    },
    {
      subject: ProductionLineSubject,
      actions: permissions.productionLine.actions,
      fieldPolicies: permissions.productionLine.fieldPolicies,
    },
  ];
}

export function MaterialAbilityBoundary({
  permissions,
  children,
}: {
  readonly permissions: MaterialAbilityPermissions;
  readonly children: React.ReactNode;
}) {
  const snapshots = React.useMemo(
    () => buildMaterialAbilitySnapshots(permissions),
    [permissions],
  );

  return (
    <TenantAbilityProvider snapshots={snapshots}>
      {children}
    </TenantAbilityProvider>
  );
}
