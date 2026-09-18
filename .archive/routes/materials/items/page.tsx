import { getItemsQuery } from "@base/feature-material-center/item-master/server";
import {
  getCategoriesQuery,
  getVarietiesQuery,
} from "@base/feature-material-center/classification/server";
import { getUnitsQuery } from "@base/feature-material-center/unit-management/server";
import { ItemMasterView } from "@base/feature-material-center/item-master";

export default async function ItemsPage() {
  const [items, categories, varieties, units] = await Promise.all([
    getItemsQuery(),
    getCategoriesQuery(),
    getVarietiesQuery(),
    getUnitsQuery(),
  ]);

  return (
    <ItemMasterView
      initialItems={items}
      categories={categories}
      varieties={varieties}
      units={units}
    />
  );
}
