"use server";
import { StandardAction } from "@base/authorization";

import { defineServerAction, toPlainData } from "@base/shared";
import {
        getTenantMaterialContext,
        assertMaterialAbility,
} from "../../assembly/context";
import {
        ItemMasterSubject,
        ItemMasterAction,
      } from "./contract";

export const createItemMasterAction = defineServerAction(
        async (input: {
                itemCode: string;
                itemName: string;
                itemAlias?: string | null;
                pictureUrl?: string | null;
                itemCategory:
                        | "RAW"
                        | "SEMI_FINISHED"
                        | "FINISHED"
                        | "PACKAGING";
                categoryId: string;
                varietyId?: string | null;
                gradeId?: string | null;
                supplyMode: "PURCHASE" | "MANUFACTURE" | "HYBRID";
                itemType?: "STANDARD" | "COMPOSITE" | "PACKAGE";
                baseUnit: string;
                purchaseUnit: string;
                salesUnit?: string | null;
                stockUnit: string;
                productionUnit?: string | null;
                minPurchaseQty?: number | null;
                minSalesQty?: number | null;
                maxSalesQty?: number;
                qtyPrecision?: number;
                shelfLifeHours?: number | null;
                batchManaged?: boolean;
                temperatureZone?: "NORMAL" | "COLD" | "FROZEN" | null;
                processingForm?: string | null;
                freshCutFlag?: boolean;
                acceptanceStandard?: string | null;
                referencePrice?: number | null;
        }) => {
                const { client, ability, userId, employeeProfile } =
                        await getTenantMaterialContext();
                assertMaterialAbility(
                        ability,
                        StandardAction.CREATE,
                        ItemMasterSubject,
                );

                const created = await (client as any).itemMaster.create({
                        data: {
                                itemCode: input.itemCode.trim(),
                                itemName: input.itemName.trim(),
                                itemAlias: input.itemAlias || null,
                                pictureUrl: input.pictureUrl || null,
                                itemCategory: input.itemCategory,
                                categoryId: input.categoryId,
                                varietyId: input.varietyId || null,
                                gradeId: input.gradeId || null,
                                supplyMode: input.supplyMode,
                                itemType: input.itemType || "STANDARD",
                                baseUnit: input.baseUnit,
                                purchaseUnit: input.purchaseUnit,
                                salesUnit: input.salesUnit || null,
                                stockUnit: input.stockUnit,
                                productionUnit: input.productionUnit || null,
                                minPurchaseQty: input.minPurchaseQty ?? null,
                                minSalesQty: input.minSalesQty ?? null,
                                maxSalesQty: input.maxSalesQty ?? 99999,
                                qtyPrecision: input.qtyPrecision ?? 2,
                                shelfLifeHours: input.shelfLifeHours ?? null,
                                batchManaged: input.batchManaged ?? true,
                                temperatureZone: input.temperatureZone || null,
                                processingForm: input.processingForm || null,
                                freshCutFlag: input.freshCutFlag ?? false,
                                acceptanceStandard:
                                        input.acceptanceStandard || null,
                                referencePrice: input.referencePrice ?? null,
                                status: "ACTIVE",
                                createdById: userId,
                                deptId: employeeProfile?.departmentId || null,
                        },
                });

                return toPlainData(created);
        },
);

export const toggleItemStatusAction = defineServerAction(
        async (input: {
                id: string;
                targetStatus: "ACTIVE" | "DISCONTINUED" | "OBSOLETE";
        }) => {
                const { client, ability, userId } =
                        await getTenantMaterialContext();
                assertMaterialAbility(
                        ability,
                        ItemMasterAction.TOGGLE_STATUS,
                        ItemMasterSubject,
                );

                const updated = await (client as any).itemMaster.update({
                        where: { id: input.id },
                        data: {
                                status: input.targetStatus,
                                updatedById: userId,
                        },
                });

                return toPlainData(updated);
        },
);
