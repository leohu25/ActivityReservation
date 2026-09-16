import { getClassificationPageDataQuery } from "@base/feature-material-center/classification/server";
import { ClassificationView } from "@base/feature-material-center/classification";

export default async function CategoriesPage() {
  const { categories, varieties, canReadCategory, canReadVariety } =
    await getClassificationPageDataQuery();

  return (
    <ClassificationView
      initialCategories={categories}
      initialVarieties={varieties}
      canReadCategory={canReadCategory}
      canReadVariety={canReadVariety}
    />
  );
}
