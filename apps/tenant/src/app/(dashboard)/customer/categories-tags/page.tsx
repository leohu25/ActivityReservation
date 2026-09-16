import { CategoryTagView } from "@base/feature-customer-center/customer-management/classification";
import { getCategoriesTagsPageDataQuery } from "@base/feature-customer-center/customer-management/classification/server";

/** 分类与标签页：组合 Classification Sub-Feature 的读取用例与 UI，支持按权细粒度优雅降级。 */
export default async function CategoriesTagsPage() {
  const { categories, tags, canReadCategory, canReadTag } =
    await getCategoriesTagsPageDataQuery();

  return (
    <CategoryTagView
      initialCategories={categories}
      initialTags={tags}
      canReadCategory={canReadCategory}
      canReadTag={canReadTag}
    />
  );
}
