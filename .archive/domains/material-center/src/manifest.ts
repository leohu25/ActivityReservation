import {
  StandardAction,
  type TenantFeatureManifest,
} from "@base/authorization";
import {
  ItemCategorySubject,
  ItemVarietySubject,
  ItemGradeSubject,
  itemCategoryPageContract,
  itemVarietyPageContract,
  itemGradePageContract,
} from "./features/classification/contract";
import {
  UnitOfMeasureSubject,
  UnitConversionSubject,
  unitManagementPageContract,
  unitConversionPageContract,
} from "./features/unit-management/contract";
import {
  ItemMasterSubject,
  itemMasterPageContract,
} from "./features/item-master/contract";
import {
  BomHeaderSubject,
  ProcessMasterSubject,
  ProductionLineSubject,
  bomManagementPageContract,
  processMasterPageContract,
  productionLinePageContract,
} from "./features/bom-management/contract";

export const materialManifest: TenantFeatureManifest = {
  id: "material-center",
  name: "物料与工艺中心",
  pages: [
    {
      pageKey: "material-categories",
      defaultLabel: "分类与品种",
      href: "/materials/categories",
      defaultIcon: "Layers",
      requiredAction: StandardAction.READ,
      requiredSubject: ItemCategorySubject,
      subjects: [ItemCategorySubject, ItemVarietySubject, ItemGradeSubject],
    },
    {
      pageKey: "material-units",
      defaultLabel: "计量单位",
      href: "/materials/units",
      defaultIcon: "Scale",
      requiredAction: StandardAction.READ,
      requiredSubject: UnitOfMeasureSubject,
      subjects: [UnitOfMeasureSubject, UnitConversionSubject],
    },
    {
      pageKey: "material-items",
      defaultLabel: "商品档案",
      href: "/materials/items",
      defaultIcon: "Boxes",
      requiredAction: StandardAction.READ,
      requiredSubject: ItemMasterSubject,
      subjects: [ItemMasterSubject],
    },
    {
      pageKey: "material-boms",
      defaultLabel: "工艺BOM",
      href: "/materials/boms",
      defaultIcon: "FileSpreadsheet",
      requiredAction: StandardAction.READ,
      requiredSubject: BomHeaderSubject,
      subjects: [BomHeaderSubject, ProcessMasterSubject, ProductionLineSubject],
    },
  ],
  permissionModules: [
    {
      moduleKey: "materials",
      label: "物料中心",
      iconName: "Boxes",
      order: 15,
      pages: [
        itemCategoryPageContract,
        itemVarietyPageContract,
        itemGradePageContract,
        unitManagementPageContract,
        unitConversionPageContract,
        itemMasterPageContract,
        bomManagementPageContract,
        processMasterPageContract,
        productionLinePageContract,
      ],
    },
  ],
};
