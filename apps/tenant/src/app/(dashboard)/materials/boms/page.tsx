import {
  getBomsQuery,
  getProductionLinesQuery,
} from "@base/feature-material-center/bom-management/server";
import { getItemsQuery } from "@base/feature-material-center/item-master/server";
import { BomManagementView } from "@base/feature-material-center/bom-management";

export default async function BomsPage() {
  const [boms, productionLines, items] = await Promise.all([
    getBomsQuery(),
    getProductionLinesQuery(),
    getItemsQuery(),
  ]);

  return (
    <BomManagementView
      initialBoms={boms}
      productionLines={productionLines}
      items={items.map((i) => ({ itemCode: i.itemCode, itemName: i.itemName }))}
    />
  );
}
