import "server-only";
import { StandardAction } from "@base/authorization";
import {
  getTenantMaterialContext,
  assertMaterialAbility,
} from "../../assembly/context";
import {
  ItemCategorySubject,
  ItemVarietySubject,
} from "./contract";

export interface CategoryListItem {
  id: string;
  categoryCode: string;
  categoryName: string;
  parentId: string | null;
  parentName: string | null;
  level: number;
  sortOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface VarietyListItem {
  id: string;
  varietyCode: string;
  varietyName: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export async function getCategoriesQuery(): Promise<CategoryListItem[]> {
  const { client, ability } = await getTenantMaterialContext();
  assertMaterialAbility(ability, StandardAction.READ, ItemCategorySubject);

  const categories = await (client as any).itemCategory.findMany({
    where: { isDeleted: false },
    orderBy: [{ level: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      parent: {
        select: { id: true, categoryName: true, categoryCode: true },
      },
    },
  });

  return categories.map((c: any) => ({
    id: c.id,
    categoryCode: c.categoryCode,
    categoryName: c.categoryName,
    parentId: c.parentId,
    parentName: c.parent?.categoryName ?? null,
    level: c.level,
    sortOrder: c.sortOrder,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
}

export async function getVarietiesQuery(): Promise<VarietyListItem[]> {
  const { client, ability } = await getTenantMaterialContext();
  assertMaterialAbility(ability, StandardAction.READ, ItemVarietySubject);

  const varieties = await (client as any).itemVariety.findMany({
    where: { isDeleted: false },
    orderBy: [{ createdAt: "desc" }],
  });

  return varieties.map((v: any) => ({
    id: v.id,
    varietyCode: v.varietyCode,
    varietyName: v.varietyName,
    description: v.description,
    status: v.status,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  }));
}
