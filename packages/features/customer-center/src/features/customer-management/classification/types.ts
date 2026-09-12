export interface CreateCategoryInput {
  categoryCode: string;
  categoryName: string;
  parentCode?: string | null;
  description?: string | null;
}

export interface CreateTagInput {
  tagCode: string;
  tagName: string;
  tagType: string;
  description?: string | null;
}

export interface CustomerCategoryItem {
  id?: string;
  categoryCode: string;
  categoryName: string;
  parentCode?: string | null;
  description?: string | null;
  status?: "ACTIVE" | "DISABLED" | string;
}

export interface CustomerTagItem {
  id?: string;
  tagCode: string;
  tagName: string;
  tagType?: string;
  description?: string | null;
  status?: "ACTIVE" | "DISABLED" | string;
}
