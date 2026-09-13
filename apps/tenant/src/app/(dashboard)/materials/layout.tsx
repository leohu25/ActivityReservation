import {
  ItemCategorySubject,
  ItemGradeSubject,
  ItemVarietySubject,
} from "@base/feature-material-center/classification";
import {
  UnitConversionSubject,
  UnitOfMeasureSubject,
} from "@base/feature-material-center/unit-management";
import { ItemMasterSubject } from "@base/feature-material-center/item-master";
import {
  BomHeaderSubject,
  ProcessMasterSubject,
  ProductionLineSubject,
} from "@base/feature-material-center/bom-management";
import { MaterialAbilityBoundary } from "@base/feature-material-center/shared";
import { getTenantSubjectPermissions } from "@/kernel";

/** Material Center Business Area 的统一 CASL Provider 装配边界。 */
export default async function MaterialsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [
    category,
    variety,
    grade,
    unit,
    conversion,
    item,
    bom,
    process,
    productionLine,
  ] = await Promise.all([
    getTenantSubjectPermissions(ItemCategorySubject),
    getTenantSubjectPermissions(ItemVarietySubject),
    getTenantSubjectPermissions(ItemGradeSubject),
    getTenantSubjectPermissions(UnitOfMeasureSubject),
    getTenantSubjectPermissions(UnitConversionSubject),
    getTenantSubjectPermissions(ItemMasterSubject),
    getTenantSubjectPermissions(BomHeaderSubject),
    getTenantSubjectPermissions(ProcessMasterSubject),
    getTenantSubjectPermissions(ProductionLineSubject),
  ]);

  return (
    <MaterialAbilityBoundary
      permissions={{
        category,
        variety,
        grade,
        unit,
        conversion,
        item,
        bom,
        process,
        productionLine,
      }}
    >
      {children}
    </MaterialAbilityBoundary>
  );
}
