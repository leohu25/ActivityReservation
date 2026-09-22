import type { FieldAccessMode } from "@base/authorization";

export interface EmployeeProfileDTO {
  readonly id: string;
  readonly memberId: string | null;
  readonly employeeNo: string | null;
  readonly name: string;
  readonly email: string;
  readonly jobTitle: string | null;
  readonly status: string;
  readonly department: {
    readonly id: string;
    readonly name: string;
    readonly code: string;
  } | null;
  readonly position: {
    readonly id: string;
    readonly name: string;
    readonly code: string;
  } | null;
}

export interface WorkbenchDataDTO {
  readonly kind: "authenticated";
  readonly org: {
    readonly name: string;
    readonly slug: string;
    readonly authorizationVersion: number;
  };
  readonly user: {
    readonly name: string;
    readonly role: string;
  };
  readonly profile: EmployeeProfileDTO | null;
  readonly treeCount: number;
  readonly sqlWhere: unknown;
  readonly fieldModes: {
    readonly customerName: FieldAccessMode;
    readonly settlementType: FieldAccessMode;
    readonly contactPhone: FieldAccessMode;
  };
  readonly permissions: {
    readonly canReadCustomer: boolean;
    readonly canCreateCustomer: boolean;
    readonly canUpdateCustomer: boolean;
    readonly canExportCustomer: boolean;
  };
}

export interface WorkbenchUnauthenticatedDTO {
  readonly kind: "unauthenticated";
  readonly message: string;
  readonly isNoOrg: boolean;
}

export interface WorkbenchBlockedDTO {
  readonly kind: "blocked";
  readonly message: string;
  readonly status?: string;
}

export type WorkbenchPageData =
  | WorkbenchDataDTO
  | WorkbenchUnauthenticatedDTO
  | WorkbenchBlockedDTO;
