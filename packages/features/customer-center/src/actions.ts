"use server";

import { revalidatePath } from "next/cache";
import { toPlainData } from "@chenrun/shared";
import { getTenantCustomerContext } from "./server/session";
import {
  CustomerCategoryTagService,
  CustomerService,
  CustomerStoreService,
  CustomerQuoteService,
} from "./services";
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

export async function getCategoryTreeAction() {
  try {
    const { client } = await getTenantCustomerContext();
    const tree = await CustomerCategoryTagService.getCategoryTree(client);
    return { success: true, data: toPlainData(tree) };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "获取分类树失败",
    };
  }
}

export async function createCategoryAction(input: {
  categoryCode: string;
  categoryName: string;
  parentCode?: string | null;
  description?: string | null;
}) {
  try {
    const { client } = await getTenantCustomerContext();
    const created = await CustomerCategoryTagService.createCategory(
      client,
      input,
    );
    revalidatePath("/customer/categories-tags");
    revalidatePath("/customer/customers");
    return { success: true, data: created };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "创建分类失败",
    };
  }
}

export async function updateCategoryStatusAction(
  categoryCode: string,
  status: "ACTIVE" | "DISABLED",
) {
  try {
    const { client } = await getTenantCustomerContext();
    const updated = await CustomerCategoryTagService.updateCategoryStatus(
      client,
      categoryCode,
      status,
    );
    revalidatePath("/customer/categories-tags");
    return { success: true, data: updated };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "变更分类状态失败",
    };
  }
}

export async function listTagsAction(tagType?: string) {
  try {
    const { client } = await getTenantCustomerContext();
    const tags = await CustomerCategoryTagService.listTags(client, tagType);
    return { success: true, data: toPlainData(tags) };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "获取标签失败",
    };
  }
}

export async function createTagAction(input: {
  tagCode: string;
  tagName: string;
  tagType: string;
  description?: string | null;
}) {
  try {
    const { client } = await getTenantCustomerContext();
    const created = await CustomerCategoryTagService.createTag(client, input);
    revalidatePath("/customer/categories-tags");
    revalidatePath("/customer/customers");
    return { success: true, data: created };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "创建标签失败",
    };
  }
}

export async function updateTagStatusAction(
  tagCode: string,
  status: "ACTIVE" | "DISABLED",
) {
  try {
    const { client } = await getTenantCustomerContext();
    const updated = await CustomerCategoryTagService.updateTagStatus(
      client,
      tagCode,
      status,
    );
    revalidatePath("/customer/categories-tags");
    return { success: true, data: updated };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "变更标签状态失败",
    };
  }
}

// ==========================================
// 客户档案 Actions
// ==========================================

export async function listCustomersAction(filter?: {
  categoryCode?: string;
  status?: string;
  keyword?: string;
  tagCode?: string;
}) {
  try {
    const { client } = await getTenantCustomerContext();
    const list = await CustomerService.listCustomers(client, filter);
    return { success: true, data: toPlainData(list) };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "获取客户列表失败",
    };
  }
}

export async function createCustomerAction(input: CreateCustomerInput) {
  try {
    const { client } = await getTenantCustomerContext();
    const created = await CustomerService.createCustomer(client, input);
    revalidatePath("/customer/customers");
    return { success: true, data: created };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "创建客户失败",
    };
  }
}

export async function updateCustomerAction(
  customerCode: string,
  input: UpdateCustomerInput,
) {
  try {
    const { client } = await getTenantCustomerContext();
    const updated = await CustomerService.updateCustomer(
      client,
      customerCode,
      input,
    );
    revalidatePath("/customer/customers");
    return { success: true, data: updated };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "更新客户失败",
    };
  }
}

export async function updateCustomerStatusAction(
  customerCode: string,
  status: "ACTIVE" | "DISABLED",
) {
  try {
    const { client } = await getTenantCustomerContext();
    const updated = await CustomerService.updateCustomerStatus(
      client,
      customerCode,
      status,
    );
    revalidatePath("/customer/customers");
    revalidatePath("/customer/stores");
    return { success: true, data: updated };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "更新客户状态失败",
    };
  }
}

export async function deleteCustomerAction(customerCode: string) {
  try {
    const { client } = await getTenantCustomerContext();
    const deleted = await CustomerService.deleteCustomer(client, customerCode);
    revalidatePath("/customer/customers");
    return { success: true, data: deleted };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "删除客户失败",
    };
  }
}

// ==========================================
// 门店档案 Actions
// ==========================================

export async function listStoresAction(filter?: {
  customerCode?: string;
  regionCode?: string;
  status?: string;
  keyword?: string;
}) {
  try {
    const { client } = await getTenantCustomerContext();
    const list = await CustomerStoreService.listStores(client, filter);
    return { success: true, data: toPlainData(list) };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "获取门店列表失败",
    };
  }
}

export async function createStoreAction(input: CreateStoreInput) {
  try {
    const { client } = await getTenantCustomerContext();
    const created = await CustomerStoreService.createStore(client, input);
    revalidatePath("/customer/stores");
    revalidatePath("/customer/customers");
    return { success: true, data: created };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "创建门店失败",
    };
  }
}

export async function updateStoreAction(
  storeCode: string,
  input: UpdateStoreInput,
) {
  try {
    const { client } = await getTenantCustomerContext();
    const updated = await CustomerStoreService.updateStore(
      client,
      storeCode,
      input,
    );
    revalidatePath("/customer/stores");
    return { success: true, data: updated };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "更新门店失败",
    };
  }
}

export async function updateStoreStatusAction(
  storeCode: string,
  status: "ACTIVE" | "DISABLED",
) {
  try {
    const { client } = await getTenantCustomerContext();
    const updated = await CustomerStoreService.updateStoreStatus(
      client,
      storeCode,
      status,
    );
    revalidatePath("/customer/stores");
    return { success: true, data: updated };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "更新门店状态失败",
    };
  }
}

export async function deleteStoreAction(storeCode: string) {
  try {
    const { client } = await getTenantCustomerContext();
    const deleted = await CustomerStoreService.deleteStore(client, storeCode);
    revalidatePath("/customer/stores");
    return { success: true, data: deleted };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "删除门店失败",
    };
  }
}

// ==========================================
// 门店报价单 Actions
// ==========================================

export async function listQuotesAction(filter?: {
  customerCode?: string;
  storeCode?: string;
  regionCode?: string;
  status?: string;
}) {
  try {
    const { client } = await getTenantCustomerContext();
    const list = await CustomerQuoteService.listQuotes(client, filter);
    return { success: true, data: toPlainData(list) };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "获取报价单列表失败",
    };
  }
}

export async function createQuoteAction(input: CreateQuoteInput) {
  try {
    const { client } = await getTenantCustomerContext();
    const created = await CustomerQuoteService.createQuote(client, input);
    revalidatePath("/customer/quotes");
    return { success: true, data: created };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "创建报价单失败",
    };
  }
}

export async function updateQuoteStatusAction(
  quoteId: string,
  status: "ACTIVE" | "VOIDED",
) {
  try {
    const { client } = await getTenantCustomerContext();
    const updated = await CustomerQuoteService.updateQuoteStatus(
      client,
      quoteId,
      status,
    );
    revalidatePath("/customer/quotes");
    return { success: true, data: updated };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "更新报价单状态失败",
    };
  }
}
