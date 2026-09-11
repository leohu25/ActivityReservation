"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@chenrun/shared";
import { pickReadableFields } from "@chenrun/authorization";
import { assertCustomerAbility, getTenantCustomerContext } from "./server/session";
import {
  CustomerCategoryTagService,
  CustomerService,
  CustomerStoreService,
  CustomerQuoteService,
} from "./services";
import {
  CustomerCategorySubject,
  CustomerQuoteSubject,
  CustomerStoreSubject,
  CustomerSubject,
} from "./contracts";
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  CreateStoreInput,
  UpdateStoreInput,
  CreateQuoteInput,
} from "./types";

// ==========================================
// 客户分类与标签 Actions
// ==========================================

export const getCategoryTreeAction = defineServerAction(async () => {
  const { client, ability } = await getTenantCustomerContext();
  assertCustomerAbility(ability, "read", CustomerCategorySubject);
  return CustomerCategoryTagService.getCategoryTree(client);
}, "获取分类树失败");

export const createCategoryAction = defineServerAction(
  async (input: {
    categoryCode: string;
    categoryName: string;
    parentCode?: string | null;
    description?: string | null;
  }) => {
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

export const listTagsAction = defineServerAction(async (tagType?: string) => {
  const { client, ability } = await getTenantCustomerContext();
  assertCustomerAbility(ability, "read", CustomerCategorySubject);
  return CustomerCategoryTagService.listTags(client, tagType);
}, "获取标签失败");

export const createTagAction = defineServerAction(
  async (input: {
    tagCode: string;
    tagName: string;
    tagType: string;
    description?: string | null;
  }) => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "create", CustomerCategorySubject);
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
    assertCustomerAbility(ability, "update", CustomerCategorySubject);
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

// ==========================================
// 客户档案 Actions
// ==========================================

export const listCustomersAction = defineServerAction(
  async (filter?: {
    categoryCode?: string;
    status?: string;
    keyword?: string;
    tagCode?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "read", CustomerSubject);
    const result = await CustomerService.listCustomers(client, filter);
    // 服务端物理剥离 HIDDEN 敏感字段，杜绝仅前端藏列仍外泄 payload
    return {
      ...result,
      items: result.items.map((item) =>
        pickReadableFields(ability, CustomerSubject, item as Record<string, unknown>),
      ),
    };
  },
  "获取客户列表失败",
);

export const createCustomerAction = defineServerAction(
  async (input: CreateCustomerInput) => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "create", CustomerSubject);
    const created = await CustomerService.createCustomer(client, input);
    revalidatePath("/customer/customers");
    return created;
  },
  "创建客户失败",
);

export const updateCustomerAction = defineServerAction(
  async (customerCode: string, input: UpdateCustomerInput) => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "update", CustomerSubject);
    const updated = await CustomerService.updateCustomer(
      client,
      customerCode,
      input,
    );
    revalidatePath("/customer/customers");
    return updated;
  },
  "更新客户失败",
);

export const updateCustomerStatusAction = defineServerAction(
  async (customerCode: string, status: "ACTIVE" | "DISABLED") => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "toggle_status", CustomerSubject);
    const updated = await CustomerService.updateCustomerStatus(
      client,
      customerCode,
      status,
    );
    revalidatePath("/customer/customers");
    revalidatePath("/customer/stores");
    return updated;
  },
  "更新客户状态失败",
);

export const deleteCustomerAction = defineServerAction(
  async (customerCode: string) => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "delete", CustomerSubject);
    const deleted = await CustomerService.deleteCustomer(client, customerCode);
    revalidatePath("/customer/customers");
    return deleted;
  },
  "删除客户失败",
);

// ==========================================
// 门店档案 Actions
// ==========================================

export const listStoresAction = defineServerAction(
  async (filter?: {
    customerCode?: string;
    regionCode?: string;
    status?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "read", CustomerStoreSubject);
    const result = await CustomerStoreService.listStores(client, filter);
    return {
      ...result,
      items: result.items.map((item) =>
        pickReadableFields(
          ability,
          CustomerStoreSubject,
          item as Record<string, unknown>,
        ),
      ),
    };
  },
  "获取门店列表失败",
);

export const createStoreAction = defineServerAction(
  async (input: CreateStoreInput) => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "create", CustomerStoreSubject);
    const created = await CustomerStoreService.createStore(client, input);
    revalidatePath("/customer/stores");
    revalidatePath("/customer/customers");
    return created;
  },
  "创建门店失败",
);

export const updateStoreAction = defineServerAction(
  async (storeCode: string, input: UpdateStoreInput) => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "update", CustomerStoreSubject);
    const updated = await CustomerStoreService.updateStore(
      client,
      storeCode,
      input,
    );
    revalidatePath("/customer/stores");
    return updated;
  },
  "更新门店失败",
);

export const updateStoreStatusAction = defineServerAction(
  async (storeCode: string, status: "ACTIVE" | "DISABLED") => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "update", CustomerStoreSubject);
    const updated = await CustomerStoreService.updateStoreStatus(
      client,
      storeCode,
      status,
    );
    revalidatePath("/customer/stores");
    return updated;
  },
  "更新门店状态失败",
);

export const deleteStoreAction = defineServerAction(
  async (storeCode: string) => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "delete", CustomerStoreSubject);
    const deleted = await CustomerStoreService.deleteStore(client, storeCode);
    revalidatePath("/customer/stores");
    return deleted;
  },
  "删除门店失败",
);

// ==========================================
// 门店报价单 Actions
// ==========================================

export const listQuotesAction = defineServerAction(
  async (filter?: {
    customerCode?: string;
    storeCode?: string;
    regionCode?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "read", CustomerQuoteSubject);
    const result = await CustomerQuoteService.listQuotes(client, filter);
    return {
      ...result,
      items: result.items.map((item) =>
        pickReadableFields(
          ability,
          CustomerQuoteSubject,
          item as Record<string, unknown>,
        ),
      ),
    };
  },
  "获取报价单列表失败",
);

export const createQuoteAction = defineServerAction(
  async (input: CreateQuoteInput) => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "create", CustomerQuoteSubject);
    const created = await CustomerQuoteService.createQuote(client, input);
    revalidatePath("/customer/quotes");
    return created;
  },
  "创建报价单失败",
);

export const updateQuoteStatusAction = defineServerAction(
  async (quoteId: string, status: "ACTIVE" | "VOIDED") => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "update", CustomerQuoteSubject);
    const updated = await CustomerQuoteService.updateQuoteStatus(
      client,
      quoteId,
      status,
    );
    revalidatePath("/customer/quotes");
    return updated;
  },
  "更新报价单状态失败",
);
