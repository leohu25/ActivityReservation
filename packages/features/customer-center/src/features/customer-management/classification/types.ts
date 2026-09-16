import type { MasterDataStatus } from "@base/shared";

export type CustomerClassificationStatus = MasterDataStatus;

export interface CreateCategoryInput {
  categoryCode?: string;
  categoryName: string;
  parentCode?: string | null;
  description?: string | null;
}

export interface UpdateCategoryInput {
  categoryName: string;
  parentCode?: string | null;
  description?: string | null;
  status?: CustomerClassificationStatus;
}

export interface CreateTagInput {
  tagCode?: string;
  tagName: string;
  tagType: string;
  description?: string | null;
}

export interface UpdateTagInput {
  tagName: string;
  tagType: string;
  description?: string | null;
  status?: CustomerClassificationStatus;
}

export interface CustomerCategoryItem {
  id?: string;
  categoryCode: string;
  categoryName: string;
  parentCode?: string | null;
  description?: string | null;
  status?: CustomerClassificationStatus;
  children?: CustomerCategoryItem[];
}

export interface CustomerTagItem {
  id?: string;
  tagCode: string;
  tagName: string;
  tagType?: string;
  description?: string | null;
  status?: CustomerClassificationStatus;
}
