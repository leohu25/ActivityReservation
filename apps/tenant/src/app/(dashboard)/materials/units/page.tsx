import {
  getUnitsQuery,
  getUnitConversionsQuery,
} from "@base/feature-material-center/unit-management/server";
import { UnitManagementView } from "@base/feature-material-center/unit-management";

export default async function UnitsPage() {
  const [units, conversions] = await Promise.all([
    getUnitsQuery(),
    getUnitConversionsQuery(),
  ]);

  return (
    <UnitManagementView initialUnits={units} initialConversions={conversions} />
  );
}
