import type {
  DataScopeType,
  FieldAccessMode,
  RolePermissionPayload,
} from "@chenrun/authorization";

/** 租户角色展示信息模型 */
export interface TenantRoleItem {
  readonly id: string;
  readonly role: string;
  readonly name: string;
  readonly description?: string;
  readonly isSystem: boolean;
  readonly permissions: RolePermissionPayload;
  readonly updatedAt?: Date | null;
}

/** 资源动作元数据模型 */
export interface ActionOption {
  readonly action: string;
  readonly label: string;
  readonly supportedScopes: readonly DataScopeType[];
  readonly supportedFields: readonly string[];
}

/** 资源权限自描述清单视图模型 */
export interface ResourcePermissionDescriptor {
  readonly resource: string;
  readonly subject: string;
  readonly label: string;
  readonly actions: readonly ActionOption[];
  readonly allFields: readonly string[];
}

/** 字段矩阵单行配置 */
export interface FieldMatrixRow {
  readonly field: string;
  readonly label?: string;
  readonly canRead: boolean;
  readonly canCreate: boolean;
  readonly canUpdate: boolean;
  readonly canExport: boolean;
}

/** 保存角色权限请求载荷 */
export interface SaveRolePermissionsInput {
  readonly organizationId: string;
  readonly role: string;
  readonly payload: RolePermissionPayload;
}

/** 创建自定义角色请求输入 */
export interface CreateRoleInput {
  readonly organizationId: string;
  readonly roleCode: string;
  readonly roleName?: string;
  readonly description?: string;
}

/** 租户企业信息展示模型 */
export interface CompanyProfileData {
  readonly id?: string;
  readonly companyName: string;
  readonly shortName?: string | null;
  readonly creditCode?: string | null;
  readonly legalPerson?: string | null;
  readonly contactPhone?: string | null;
  readonly contactEmail?: string | null;
  readonly address?: string | null;
  readonly timezone: string;
  readonly currency: string;
  readonly updatedAt?: Date | null;
}

/** 更新企业信息输入模型 */
export interface UpdateCompanyProfileInput {
  readonly companyName: string;
  readonly shortName?: string | null;
  readonly creditCode?: string | null;
  readonly legalPerson?: string | null;
  readonly contactPhone?: string | null;
  readonly contactEmail?: string | null;
  readonly address?: string | null;
  readonly timezone?: string;
  readonly currency?: string;
}

/** 租户系统基础设置展示模型 */
export interface GeneralSettingsData {
  readonly systemName: string;
  readonly defaultPageSize: number;
  readonly orderPrefix: string;
  readonly dateFormat: string;
  readonly amountPrecision: number;
}

/** 更新基础设置输入模型 */
export interface UpdateGeneralSettingsInput {
  readonly systemName?: string;
  readonly defaultPageSize?: number;
  readonly orderPrefix?: string;
  readonly dateFormat?: string;
  readonly amountPrecision?: number;
}

/** 租户安全设置展示模型 */
export interface SecuritySettingsData {
  readonly sessionIdleTimeoutMinutes: number;
  readonly forceChangeInitialPassword: boolean;
  readonly passwordMinLength: number;
  readonly requireSpecialChar: boolean;
}

/** 更新安全设置输入模型 */
export interface UpdateSecuritySettingsInput {
  readonly sessionIdleTimeoutMinutes?: number;
  readonly forceChangeInitialPassword?: boolean;
  readonly passwordMinLength?: number;
  readonly requireSpecialChar?: boolean;
}

/** 部门树节点视图模型 */
export interface DepartmentTreeNode {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly parentId: string | null;
  readonly leaderMemberId: string | null;
  readonly leaderName: string | null;
  readonly sort: number;
  readonly status: string;
  readonly employeeCount: number;
  readonly children: readonly DepartmentTreeNode[];
  readonly createdAt: Date;
}

/** 创建部门输入模型 */
export interface CreateDepartmentInput {
  readonly name: string;
  readonly code: string;
  readonly parentId?: string | null;
  readonly leaderMemberId?: string | null;
  readonly sort?: number;
}

/** 更新部门输入模型 */
export interface UpdateDepartmentInput {
  readonly name?: string;
  readonly code?: string;
  readonly parentId?: string | null;
  readonly leaderMemberId?: string | null;
  readonly sort?: number;
  readonly status?: string;
}

/** 岗位展示信息模型 */
export interface PositionItem {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly description: string | null;
  readonly sort: number;
  readonly status: string;
  readonly employeeCount: number;
  readonly createdAt: Date;
}

/** 创建岗位输入模型 */
export interface CreatePositionInput {
  readonly name: string;
  readonly code: string;
  readonly description?: string | null;
  readonly sort?: number;
}

/** 更新岗位输入模型 */
export interface UpdatePositionInput {
  readonly name?: string;
  readonly code?: string;
  readonly description?: string | null;
  readonly sort?: number;
  readonly status?: string;
}

/** 员工管理列表单项模型 */
export interface EmployeeItem {
  readonly id: string;
  readonly memberId: string | null;
  readonly userId: string | null;
  readonly employeeNo: string | null;
  readonly name: string;
  readonly email: string;
  readonly departmentId: string | null;
  readonly departmentName: string | null;
  readonly positionId: string | null;
  readonly positionName: string | null;
  readonly managerEmployeeId: string | null;
  readonly managerName: string | null;
  readonly jobTitle: string | null;
  readonly roles: readonly string[];
  readonly status: string;
  readonly joinedAt: Date | null;
  readonly createdAt: Date;
}

/** 员工列表查询过滤条件 */
export interface EmployeeListFilter {
  readonly departmentId?: string;
  readonly includeChildren?: boolean;
  readonly positionId?: string;
  readonly role?: string;
  readonly status?: string;
  readonly search?: string;
}

/** 直接录入建号创建员工输入 */
export interface DirectCreateEmployeeInput {
  readonly name: string;
  readonly email: string;
  readonly employeeNo?: string;
  readonly departmentId?: string | null;
  readonly positionId?: string | null;
  readonly managerEmployeeId?: string | null;
  readonly jobTitle?: string;
  readonly initialRoleCodes: readonly string[];
  readonly password?: string;
}

/** 调换部门输入 */
export interface TransferDepartmentInput {
  readonly employeeId: string;
  readonly targetDepartmentId: string | null;
}

/** 调换岗位输入 */
export interface TransferPositionInput {
  readonly employeeId: string;
  readonly targetPositionId: string | null;
}

/** 调换角色输入 */
export interface TransferRolesInput {
  readonly memberId: string;
  readonly newRoleCodes: readonly string[];
}

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
