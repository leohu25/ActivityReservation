import type { StandardAction } from "@base/authorization";
import type {
  ClassificationAction,
  ItemCategorySubject,
  ItemGradeSubject,
  ItemVarietySubject,
} from "../features/classification/contract";
import type {
  ItemMasterAction,
  ItemMasterSubject,
} from "../features/item-master/contract";
import type {
  UnitConversionSubject,
  UnitManagementAction,
  UnitOfMeasureSubject,
} from "../features/unit-management/contract";
import type {
  BomAction,
  BomHeaderSubject,
  ProcessMasterSubject,
  ProductionLineSubject,
} from "../features/bom-management/contract";

/** 物料中心全域受控实体 Subject 强类型联合 */
export type MaterialSubject =
  | ItemCategorySubject
  | ItemVarietySubject
  | ItemGradeSubject
  | ItemMasterSubject
  | UnitOfMeasureSubject
  | UnitConversionSubject
  | BomHeaderSubject
  | ProcessMasterSubject
  | ProductionLineSubject;

/** 物料中心全域受控操作 Action 强类型联合 */
export type MaterialAction =
  | StandardAction
  | (typeof ClassificationAction)[keyof typeof ClassificationAction]
  | (typeof ItemMasterAction)[keyof typeof ItemMasterAction]
  | (typeof UnitManagementAction)[keyof typeof UnitManagementAction]
  | (typeof BomAction)[keyof typeof BomAction];
