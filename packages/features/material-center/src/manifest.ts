import {
  StandardAction,
  type TenantFeatureManifest,
} from "@base/authorization";
import {
  ItemCategorySubject,
  itemCategoryPageContract,
  itemVarietyPageContract,
  itemGradePageContract,
} from "./features/classification/contract";
import {
  UnitOfMeasureSubject,
  unitManagementPageContract,
  unitConversionPageContract,
} from "./features/unit-management/contract";
import {
  ItemMasterSubject,
  itemMasterPageContract,
} from "./features/item-master/contract";
import {
  BomHeaderSubject,
  bomManagementPageContract,
  processMasterPageContract,
  productionLinePageContract,
} from "./features/bom-management/contract";

export const materialManifest: TenantFeatureManifest = {
  id: "material-center",
  name: "物料与工艺中心",
  order: 15,
  navSections: [
    {
      id: "materials",
      order: 15,
      items: [
        {
          id: "group-material-center",
          label: "物料管理",
          icon: "Boxes",
          items: [
            {
              id: "material-categories",
              label: "分类与品种",
              href: "/materials/categories",
              requiredAction: StandardAction.READ,
              requiredSubject: ItemCategorySubject,
            },
            {
              id: "material-units",
              label: "计量单位",
              href: "/materials/units",
              requiredAction: StandardAction.READ,
              requiredSubject: UnitOfMeasureSubject,
            },
            {
              id: "material-items",
              label: "商品档案",
              href: "/materials/items",
              requiredAction: StandardAction.READ,
              requiredSubject: ItemMasterSubject,
            },
            {
              id: "material-boms",
              label: "工艺BOM",
              href: "/materials/boms",
              requiredAction: StandardAction.READ,
              requiredSubject: BomHeaderSubject,
            },
          ],
        },
      ],
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
