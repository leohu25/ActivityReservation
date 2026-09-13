import "server-only";
import { StandardAction } from "@base/authorization";

import {
  getTenantMaterialContext,
  assertMaterialAbility,
} from "../../assembly/context";
import { ItemMasterSubject } from "./contract";

export interface ItemMasterListItem {
  id: string;
  itemCode: string;
  itemName: string;
  itemAlias: string | null;
  pictureUrl: string | null;
  itemCategory: string;
  categoryId: string;
  categoryName: string;
  varietyId: string | null;
  varietyName: string | null;
  gradeId: string | null;
  gradeName: string | null;
  supplyMode: string;
  itemType: string;
  baseUnit: string;
  purchaseUnit: string;
  salesUnit: string | null;
  stockUnit: string;
  productionUnit: string | null;
  minPurchaseQty: number | null;
  minSalesQty: number | null;
  maxSalesQty: number;
  qtyPrecision: number;
  shelfLifeHours: number | null;
  batchManaged: boolean;
  temperatureZone: string | null;
  processingForm: string | null;
  freshCutFlag: boolean;
  referencePrice: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export async function getItemsQuery(filter?: {
  itemCategory?: string;
  categoryId?: string;
  search?: string;
}): Promise<ItemMasterListItem[]> {
  const { client, ability } = await getTenantMaterialContext();
  assertMaterialAbility(ability, StandardAction.READ, ItemMasterSubject);

  const items = await (client as any).itemMaster.findMany({
    where: {
      isDeleted: false,
      ...(filter?.itemCategory ? { itemCategory: filter.itemCategory } : {}),
      ...(filter?.categoryId ? { categoryId: filter.categoryId } : {}),
      ...(filter?.search
        ? {
            OR: [
              { itemName: { contains: filter.search } },
              { itemCode: { contains: filter.search } },
              { itemAlias: { contains: filter.search } },
            ],
          }
        : {}),
    },
    include: {
      category: { select: { categoryName: true } },
      variety: { select: { varietyName: true } },
      grade: { select: { gradeName: true } },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return items.map((i: any) => ({
    id: i.id,
    itemCode: i.itemCode,
    itemName: i.itemName,
    itemAlias: i.itemAlias,
    pictureUrl: i.pictureUrl,
    itemCategory: i.itemCategory,
    categoryId: i.categoryId,
    categoryName: i.category.categoryName,
    varietyId: i.varietyId,
    varietyName: i.variety?.varietyName ?? null,
    gradeId: i.gradeId,
    gradeName: i.grade?.gradeName ?? null,
    supplyMode: i.supplyMode,
    itemType: i.itemType,
    baseUnit: i.baseUnit,
    purchaseUnit: i.purchaseUnit,
    salesUnit: i.salesUnit,
    stockUnit: i.stockUnit,
    productionUnit: i.productionUnit,
    minPurchaseQty: i.minPurchaseQty ? Number(i.minPurchaseQty) : null,
    minSalesQty: i.minSalesQty ? Number(i.minSalesQty) : null,
    maxSalesQty: Number(i.maxSalesQty),
    qtyPrecision: i.qtyPrecision,
    shelfLifeHours: i.shelfLifeHours,
    batchManaged: i.batchManaged,
    temperatureZone: i.temperatureZone,
    processingForm: i.processingForm,
    freshCutFlag: i.freshCutFlag,
    referencePrice: i.referencePrice ? Number(i.referencePrice) : null,
    status: i.status,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  }));
}
