export type {
  CategoryListItem,
  VarietyListItem,
} from "./queries";

export interface CreateCategoryInput {
  categoryCode: string;
  categoryName: string;
  parentId?: string | null;
  level?: number;
  sortOrder?: number;
}

export interface CreateVarietyInput {
  varietyCode: string;
  varietyName: string;
  description?: string | null;
}
