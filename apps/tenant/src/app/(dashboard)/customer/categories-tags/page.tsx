import React from "react";
import {
  CategoryTagView,
  getCategoryTreeAction,
  listTagsAction,
} from "@chenrun/feature-customer-center";

export default async function CategoriesTagsPage() {
  const [treeRes, tagsRes] = await Promise.all([
    getCategoryTreeAction(),
    listTagsAction(),
  ]);

  const categories = treeRes.success && treeRes.data ? treeRes.data : [];
  const tags = tagsRes.success && tagsRes.data ? tagsRes.data : [];

  return <CategoryTagView initialCategories={categories} initialTags={tags} />;
}
