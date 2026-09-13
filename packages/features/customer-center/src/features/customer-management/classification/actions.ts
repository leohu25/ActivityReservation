"use server";
import { StandardAction } from "@base/authorization";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import {
  assertCustomerAbility,
  getTenantCustomerContext,
} from "../../../assembly/context";
import { CustomerCategorySubject, CustomerTagSubject } from "./contract";
import { CustomerCategoryTagService } from "./service";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateTagInput,
  UpdateTagInput,
} from "./types";

export const createCategoryAction = defineServerAction(
  async (input: CreateCategoryInput) => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, StandardAction.CREATE, CustomerCategorySubject);
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

export const updateCategoryAction = defineServerAction(
  async (categoryCode: string, input: UpdateCategoryInput) => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, StandardAction.UPDATE, CustomerCategorySubject);
    const updated = await CustomerCategoryTagService.updateCategory(
      client,
      categoryCode,
      input,
    );
    revalidatePath("/customer/categories-tags");
    revalidatePath("/customer/customers");
    return updated;
  },
  "修改分类失败",
);

export const deleteCategoryAction = defineServerAction(
  async (categoryCode: string) => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, StandardAction.DELETE, CustomerCategorySubject);
    const deleted = await CustomerCategoryTagService.deleteCategory(
      client,
      categoryCode,
    );
    revalidatePath("/customer/categories-tags");
    revalidatePath("/customer/customers");
    return deleted;
  },
  "删除分类失败",
);

export const updateCategoryStatusAction = defineServerAction(
  async (categoryCode: string, status: "ACTIVE" | "DISABLED") => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, StandardAction.UPDATE, CustomerCategorySubject);
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
    assertCustomerAbility(ability, StandardAction.CREATE, CustomerTagSubject);
    const created = await CustomerCategoryTagService.createTag(client, input);
    revalidatePath("/customer/categories-tags");
    revalidatePath("/customer/customers");
    return created;
  },
  "创建标签失败",
);

export const updateTagAction = defineServerAction(
  async (tagCode: string, input: UpdateTagInput) => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, StandardAction.UPDATE, CustomerTagSubject);
    const updated = await CustomerCategoryTagService.updateTag(
      client,
      tagCode,
      input,
    );
    revalidatePath("/customer/categories-tags");
    revalidatePath("/customer/customers");
    return updated;
  },
  "修改标签失败",
);

export const deleteTagAction = defineServerAction(async (tagCode: string) => {
  const { client, ability } = await getTenantCustomerContext();
  assertCustomerAbility(ability, StandardAction.DELETE, CustomerTagSubject);
  const deleted = await CustomerCategoryTagService.deleteTag(client, tagCode);
  revalidatePath("/customer/categories-tags");
  revalidatePath("/customer/customers");
  return deleted;
}, "删除标签失败");

export const updateTagStatusAction = defineServerAction(
  async (tagCode: string, status: "ACTIVE" | "DISABLED") => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, StandardAction.UPDATE, CustomerTagSubject);
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
