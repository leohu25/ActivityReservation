import type { FieldAccessMode } from "@base/authorization";

export interface EmployeeProfileDTO {
  readonly id: string;
  readonly memberId: string | null;
  readonly employeeNo: string | null;
  readonly nameSnapshot: string;
  readonly emailSnapshot: string;
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
    readonly supplierName: FieldAccessMode;
    readonly costPrice: FieldAccessMode;
    readonly quantity: FieldAccessMode;
  };
  readonly permissions: {
    readonly canReadOrder: boolean;
    readonly canCreateOrder: boolean;
    readonly canAuditOrder: boolean;
    readonly canExportOrder: boolean;
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
