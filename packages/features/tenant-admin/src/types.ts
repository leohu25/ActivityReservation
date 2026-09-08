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
