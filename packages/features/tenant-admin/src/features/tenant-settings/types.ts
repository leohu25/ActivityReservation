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
