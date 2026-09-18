import { getBomManagementPageDataQuery } from "@base/feature-material-center/bom-management/server";
import { getItemsQuery } from "@base/feature-material-center/item-master/server";
import { BomManagementView } from "@base/feature-material-center/bom-management";

async function safeGetItems() {
  try {
    return await getItemsQuery();
  } catch {
    return [];
  }
}

export default async function BomsPage() {
  const [{ boms, productionLines, processTemplates }, items] =
    await Promise.all([getBomManagementPageDataQuery(), safeGetItems()]);

  return (
    <BomManagementView
      initialBoms={boms ?? []}
      productionLines={productionLines ?? []}
      items={(items || []).map((i) => ({
        itemCode: i.itemCode,
        itemName: i.itemName,
        baseUnit: i.baseUnit,
      }))}
      processTemplates={processTemplates ?? []}
    />
  );
}
