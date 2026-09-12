import { CategoryTagView } from "@chenrun/feature-customer-center/customer-management/classification";
import {
  getCategoryTreeQuery,
  listTagsQuery,
} from "@chenrun/feature-customer-center/customer-management/classification/server";

/** 分类与标签页：组合 Classification Sub-Feature 的读取用例与 UI。 */
export default async function CategoriesTagsPage() {
  const [categories, tags] = await Promise.all([
    getCategoryTreeQuery(),
    listTagsQuery(),
  ]);

  return <CategoryTagView initialCategories={categories} initialTags={tags} />;
}
