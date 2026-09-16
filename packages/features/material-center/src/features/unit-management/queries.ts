import "server-only";
import { StandardAction } from "@base/authorization";

import {
  getTenantMaterialContext,
  assertMaterialAbility,
} from "../../assembly/context";
import { UnitConversionSubject, UnitOfMeasureSubject } from "./contract";

export interface UnitListItem {
  id: string;
  unitCode: string;
  unitName: string;
  unitType: string;
  baseRatio: number;
  isBaseUnit: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnitConversionListItem {
  id: string;
  itemCode: string | null;
  fromUnitId: string;
  fromUnitName: string;
  toUnitId: string;
  toUnitName: string;
  conversionRate: number;
  createdAt: string;
  updatedAt: string;
}

export async function getUnitsQuery(): Promise<UnitListItem[]> {
  const { client, ability } = await getTenantMaterialContext();
  assertMaterialAbility(ability, StandardAction.READ, UnitOfMeasureSubject);

  const units = await client.unitOfMeasure.findMany({
    where: { isDeleted: false },
    orderBy: [
      { unitType: "asc" },
      { isBaseUnit: "desc" },
      { createdAt: "asc" },
    ],
  });

  return units.map((u) => ({
    id: u.id,
    unitCode: u.unitCode,
    unitName: u.unitName,
    unitType: u.unitType,
    baseRatio: Number(u.baseRatio),
    isBaseUnit: u.isBaseUnit,
    status: u.status,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));
}

export async function getUnitConversionsQuery(
  itemCode?: string,
): Promise<UnitConversionListItem[]> {
  const { client, ability } = await getTenantMaterialContext();
  assertMaterialAbility(ability, StandardAction.READ, UnitConversionSubject);

  const conversions = await client.unitConversion.findMany({
    where: {
      isDeleted: false,
      ...(itemCode ? { itemCode } : {}),
    },
    include: {
      fromUnit: { select: { unitName: true } },
      toUnit: { select: { unitName: true } },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return conversions.map((c) => ({
    id: c.id,
    itemCode: c.itemCode,
    fromUnitId: c.fromUnitId,
    fromUnitName: c.fromUnit.unitName,
    toUnitId: c.toUnitId,
    toUnitName: c.toUnit.unitName,
    conversionRate: Number(c.conversionRate),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
}
