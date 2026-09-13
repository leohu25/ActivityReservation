import {
  getCategoriesQuery,
  getVarietiesQuery,
} from "@base/feature-material-center/classification/server";
import { ClassificationView } from "@base/feature-material-center/classification";

export default async function CategoriesPage() {
  const [categories, varieties] = await Promise.all([
    getCategoriesQuery(),
    getVarietiesQuery(),
  ]);

  return (
    <ClassificationView
      initialCategories={categories}
      initialVarieties={varieties}
    />
  );
}
