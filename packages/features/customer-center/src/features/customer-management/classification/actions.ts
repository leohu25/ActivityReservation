"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import {
  assertCustomerAbility,
  getTenantCustomerContext,
} from "../../../assembly/context";
import { CustomerCategorySubject, CustomerTagSubject } from "./contract";
import { CustomerCategoryTagService } from "./service";
import type { CreateCategoryInput, CreateTagInput } from "./types";

export const createCategoryAction = defineServerAction(
  async (input: CreateCategoryInput) => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "create", CustomerCategorySubject);
    const created = await CustomerCategoryTagService.createCategory(
      client,
      input,
    );
    revalidatePath("/customer/categories-tags");
    revalidatePath("/customer/customers");
    return created;
  },
  "创建分类失败",
);

export const updateCategoryStatusAction = defineServerAction(
  async (categoryCode: string, status: "ACTIVE" | "DISABLED") => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "update", CustomerCategorySubject);
    const updated = await CustomerCategoryTagService.updateCategoryStatus(
      client,
      categoryCode,
      status,
    );
    revalidatePath("/customer/categories-tags");
    return updated;
  },
  "变更分类状态失败",
);

export const createTagAction = defineServerAction(
  async (input: CreateTagInput) => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "create", CustomerTagSubject);
    const created = await CustomerCategoryTagService.createTag(client, input);
    revalidatePath("/customer/categories-tags");
    revalidatePath("/customer/customers");
    return created;
  },
  "创建标签失败",
);

export const updateTagStatusAction = defineServerAction(
  async (tagCode: string, status: "ACTIVE" | "DISABLED") => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "update", CustomerTagSubject);
    const updated = await CustomerCategoryTagService.updateTagStatus(
      client,
      tagCode,
      status,
    );
    revalidatePath("/customer/categories-tags");
    return updated;
  },
  "变更标签状态失败",
);
