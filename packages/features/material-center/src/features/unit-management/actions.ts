"use server";
import { StandardAction } from "@base/authorization";

import { defineServerAction, toPlainData } from "@base/shared";
import {
  getTenantMaterialContext,
  assertMaterialAbility,
} from "../../assembly/context";
import {
  UnitConversionSubject,
  UnitOfMeasureSubject,
  UnitManagementAction,
} from "./contract";

export const createUnitAction = defineServerAction(
  async (input: {
    unitCode: string;
    unitName: string;
    unitType: "WEIGHT" | "COUNT" | "VOLUME";
    baseRatio: number;
    isBaseUnit?: boolean;
  }) => {
    const { client, ability, userId, employeeProfile } =
      await getTenantMaterialContext();
    assertMaterialAbility(ability, StandardAction.CREATE, UnitOfMeasureSubject);

    const created = await (client as any).unitOfMeasure.create({
      data: {
        unitCode: input.unitCode.trim(),
        unitName: input.unitName.trim(),
        unitType: input.unitType,
        baseRatio: input.baseRatio,
        isBaseUnit: input.isBaseUnit || false,
        status: "ACTIVE",
        createdById: userId,
        deptId: employeeProfile?.departmentId || null,
      },
    });

    return toPlainData(created);
  },
);

export const configureConversionAction = defineServerAction(
  async (input: {
    itemCode?: string | null;
    fromUnitId: string;
    toUnitId: string;
    conversionRate: number;
  }) => {
    const { client, ability, userId, employeeProfile } =
      await getTenantMaterialContext();
    assertMaterialAbility(
      ability,
      UnitManagementAction.CONFIGURE_CONVERSION,
      UnitConversionSubject,
    );

    const conversion = await (client as any).unitConversion.upsert({
      where: {
        itemCode_fromUnitId_toUnitId: {
          itemCode: input.itemCode || null,
          fromUnitId: input.fromUnitId,
          toUnitId: input.toUnitId,
        },
      },
      update: {
        conversionRate: input.conversionRate,
        updatedById: userId,
      },
      create: {
        itemCode: input.itemCode || null,
        fromUnitId: input.fromUnitId,
        toUnitId: input.toUnitId,
        conversionRate: input.conversionRate,
        createdById: userId,
        deptId: employeeProfile?.departmentId || null,
      },
    });

    return toPlainData(conversion);
  },
);
