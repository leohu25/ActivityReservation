export interface UnitListItem {
  id: string;
  unitCode: string;
  unitName: string;
  unitType: string;
  baseRatio: number;
  isBaseUnit: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnitConversionListItem {
  id: string;
  itemCode: string | null;
  fromUnitId: string;
  fromUnitName: string;
  toUnitId: string;
  toUnitName: string;
  conversionRate: number;
  createdAt: string;
  updatedAt: string;
}
