"use server";
import { StandardAction } from "@base/authorization";

import { defineServerAction, toPlainData } from "@base/shared";
import {
  getTenantMaterialContext,
  assertMaterialAbility,
} from "../../assembly/context";
import {
  ItemCategorySubject,
  ItemVarietySubject,
  ClassificationAction,
} from "./contract";

export const createCategoryAction = defineServerAction(
  async (input: {
    categoryCode: string;
    categoryName: string;
    parentId?: string | null;
    level?: number;
    sortOrder?: number;
  }) => {
    const { client, ability, userId, employeeProfile } =
      await getTenantMaterialContext();
    assertMaterialAbility(ability, StandardAction.CREATE, ItemCategorySubject);

    const created = await (client as any).itemCategory.create({
      data: {
        categoryCode: input.categoryCode.trim(),
        categoryName: input.categoryName.trim(),
        parentId: input.parentId || null,
        level: input.level || 1,
        sortOrder: input.sortOrder || 0,
        status: "ACTIVE",
        createdById: userId,
        deptId: employeeProfile?.departmentId || null,
      },
    });

    return toPlainData(created);
  },
);

export const updateCategoryAction = defineServerAction(
  async (input: {
    id: string;
    categoryName?: string;
    parentId?: string | null;
    level?: number;
    sortOrder?: number;
    status?: string;
  }) => {
    const { client, ability, userId } = await getTenantMaterialContext();
    assertMaterialAbility(ability, StandardAction.UPDATE, ItemCategorySubject);

    const updated = await (client as any).itemCategory.update({
      where: { id: input.id },
      data: {
        ...(input.categoryName
          ? { categoryName: input.categoryName.trim() }
          : {}),
        ...(input.parentId === undefined ? {} : { parentId: input.parentId }),
        ...(input.level === undefined ? {} : { level: input.level }),
        ...(input.sortOrder === undefined
          ? {}
          : { sortOrder: input.sortOrder }),
        ...(input.status ? { status: input.status } : {}),
        updatedById: userId,
      },
    });

    return toPlainData(updated);
  },
);

export const deleteCategoryAction = defineServerAction(
  async (input: { id: string }) => {
    const { client, ability, userId } = await getTenantMaterialContext();
    assertMaterialAbility(ability, StandardAction.DELETE, ItemCategorySubject);

    // 软删除
    const deleted = await (client as any).itemCategory.update({
      where: { id: input.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: userId,
      },
    });

    return toPlainData(deleted);
  },
);

export const createVarietyAction = defineServerAction(
  async (input: {
    varietyCode: string;
    varietyName: string;
    description?: string | null;
  }) => {
    const { client, ability, userId, employeeProfile } =
      await getTenantMaterialContext();
    assertMaterialAbility(ability, StandardAction.CREATE, ItemVarietySubject);

    const created = await (client as any).itemVariety.create({
      data: {
        varietyCode: input.varietyCode.trim(),
        varietyName: input.varietyName.trim(),
        description: input.description || null,
        status: "ACTIVE",
        createdById: userId,
        deptId: employeeProfile?.departmentId || null,
      },
    });

    return toPlainData(created);
  },
);

export const toggleVarietyStatusAction = defineServerAction(
  async (input: { id: string; targetStatus: "ACTIVE" | "DISABLED" }) => {
    const { client, ability, userId } = await getTenantMaterialContext();
    assertMaterialAbility(
      ability,
      ClassificationAction.TOGGLE_STATUS,
      ItemVarietySubject,
    );

    const updated = await (client as any).itemVariety.update({
      where: { id: input.id },
      data: {
        status: input.targetStatus,
        updatedById: userId,
      },
    });

    return toPlainData(updated);
  },
);
