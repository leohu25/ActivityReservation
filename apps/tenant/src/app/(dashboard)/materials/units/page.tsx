import { getUnitManagementPageDataQuery } from "@base/feature-material-center/unit-management/server";
import { UnitManagementView } from "@base/feature-material-center/unit-management";

export default async function UnitsPage() {
  const { units, conversions, canReadUnit, canReadConversion } =
    await getUnitManagementPageDataQuery();

  return (
    <UnitManagementView
      initialUnits={units}
      initialConversions={conversions}
      canReadUnit={canReadUnit}
      canReadConversion={canReadConversion}
    />
  );
}
