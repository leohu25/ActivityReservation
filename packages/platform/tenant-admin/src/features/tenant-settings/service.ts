import type { ControlPrismaClient } from "@base/db-control";
import type { TenantPrismaClient } from "@base/db-tenant";
import {
  BusinessError,
  isValidEmail,
  isValidMobilePhone,
  isValidUnifiedSocialCreditCode,
  ValidationError,
} from "@base/shared";
import type {
  CompanyProfileData,
  UpdateCompanyProfileInput,
  GeneralSettingsData,
  UpdateGeneralSettingsInput,
  SecuritySettingsData,
  UpdateSecuritySettingsInput,
} from "./types";

/** 租户基础设置默认值 */
export const DEFAULT_GENERAL_SETTINGS: GeneralSettingsData = {
  systemName: "企业数字化协同平台",
  defaultPageSize: 10,
  orderPrefix: "DOC-",
  dateFormat: "YYYY-MM-DD",
  amountPrecision: 2,
};

/** 租户安全策略设置默认值 */
export const DEFAULT_SECURITY_SETTINGS: SecuritySettingsData = {
  sessionIdleTimeoutMinutes: 60,
  forceChangeInitialPassword: true,
  passwordMinLength: 8,
  requireSpecialChar: true,
};

interface OrganizationMetadataContainer {
  generalSettings?: Partial<GeneralSettingsData>;
  securitySettings?: Partial<SecuritySettingsData>;
  [key: string]: unknown;
}

/**
 * 租户企业信息与系统设置管理领域服务 (Tenant Settings Service)
 * 职责：
 * 1. 负责租户物理库 CompanyProfile 的独立读写与更新
 * 2. 负责 Control DB Organization.metadata 中通用基础偏好与安全策略的结构化持久化
 */
export class TenantSettingsService {
  constructor(
    private readonly controlPrisma: ControlPrismaClient,
    private readonly tenantDbResolver: (
      organizationId: string,
    ) => Promise<TenantPrismaClient>,
  ) {}

  /**
   * 读取租户企业扩展资料与基础设施配置
   */
  async getCompanyProfile(organizationId: string): Promise<CompanyProfileData> {
    const org = await this.controlPrisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, logo: true, metadata: true },
    });

    const metadata = this.parseMetadata(org?.metadata);
    const systemName =
      metadata.generalSettings?.systemName || org?.name || "企业数字化协同平台";
    const logoUrl = org?.logo || null;

    const tenantPrisma = await this.tenantDbResolver(organizationId);
    const profile = await tenantPrisma.companyProfile.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (profile) {
      return {
        id: profile.id,
        systemName,
        logoUrl,
        companyName: profile.companyName,
        shortName: profile.shortName,
        creditCode: profile.creditCode,
        legalPerson: profile.legalPerson,
        contactPhone: profile.contactPhone,
        contactEmail: profile.contactEmail,
        address: profile.address,
        timezone: profile.timezone,
        currency: profile.currency,
        updatedAt: profile.updatedAt,
      };
    }

    return {
      systemName,
      logoUrl,
      companyName: org?.name ?? "企业工作空间",
      shortName: null,
      creditCode: null,
      legalPerson: null,
      contactPhone: null,
      contactEmail: null,
      address: null,
      timezone: "Asia/Shanghai",
      currency: "CNY",
      updatedAt: null,
    };
  }

  /**
   * 更新或新建租户企业扩展资料与基础设施配置
   */
  async updateCompanyProfile(
    organizationId: string,
    input: UpdateCompanyProfileInput,
  ): Promise<CompanyProfileData> {
    const cleanCompanyName = input.companyName?.trim();
    if (!cleanCompanyName) {
      throw new BusinessError("企业名称不能为空");
    }

    const cleanCreditCode = input.creditCode?.trim();
    if (cleanCreditCode && !isValidUnifiedSocialCreditCode(cleanCreditCode)) {
      throw new ValidationError(
        `统一社会信用代码格式不合法: [${cleanCreditCode}]，必须符合国家标准 18 位规范`,
      );
    }

    const cleanPhone = input.contactPhone?.trim();
    if (cleanPhone && !isValidMobilePhone(cleanPhone)) {
      throw new ValidationError(`联系人手机号码格式不合法: [${cleanPhone}]`);
    }

    const cleanEmail = input.contactEmail?.trim();
    if (cleanEmail && !isValidEmail(cleanEmail)) {
      throw new ValidationError(`联系人电子邮箱格式不合法: [${cleanEmail}]`);
    }

    const tenantPrisma = await this.tenantDbResolver(organizationId);
    const existing = await tenantPrisma.companyProfile.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const updatePayload = {
      companyName: cleanCompanyName,
      shortName: input.shortName?.trim() || null,
      creditCode: cleanCreditCode || null,
      legalPerson: input.legalPerson?.trim() || null,
      contactPhone: cleanPhone || null,
      contactEmail: cleanEmail || null,
      address: input.address?.trim() || null,
      timezone: input.timezone?.trim() || "Asia/Shanghai",
      currency: input.currency?.trim() || "CNY",
    };

    let savedProfile;
    if (existing) {
      savedProfile = await tenantPrisma.companyProfile.update({
        where: { id: existing.id },
        data: updatePayload,
      });
    } else {
      savedProfile = await tenantPrisma.companyProfile.create({
        data: updatePayload,
      });
    }

    // 同步更新 Control DB 中 Organization 的展示名称、Logo 与 metadata.generalSettings.systemName
    const org = await this.controlPrisma.organization.findUnique({
      where: { id: organizationId },
      select: { metadata: true },
    });
    const metadata = this.parseMetadata(org?.metadata);
    const targetSystemName =
      input.systemName?.trim() ||
      metadata.generalSettings?.systemName ||
      cleanCompanyName;
    metadata.generalSettings = {
      ...DEFAULT_GENERAL_SETTINGS,
      ...metadata.generalSettings,
      systemName: targetSystemName,
    };

    const targetLogo =
      input.logoUrl !== undefined ? input.logoUrl?.trim() || null : undefined;

    await this.controlPrisma.organization.update({
      where: { id: organizationId },
      data: {
        name: cleanCompanyName,
        ...(targetLogo !== undefined ? { logo: targetLogo } : {}),
        metadata: JSON.stringify(metadata),
      },
    });

    return {
      id: savedProfile.id,
      systemName: targetSystemName,
      logoUrl: targetLogo !== undefined ? targetLogo : null,
      companyName: savedProfile.companyName,
      shortName: savedProfile.shortName,
      creditCode: savedProfile.creditCode,
      legalPerson: savedProfile.legalPerson,
      contactPhone: savedProfile.contactPhone,
      contactEmail: savedProfile.contactEmail,
      address: savedProfile.address,
      timezone: savedProfile.timezone,
      currency: savedProfile.currency,
      updatedAt: savedProfile.updatedAt,
    };
  }

  /**
   * 读取租户系统基础设置偏好
   */
  async getGeneralSettings(
    organizationId: string,
  ): Promise<GeneralSettingsData> {
    const org = await this.controlPrisma.organization.findUnique({
      where: { id: organizationId },
      select: { metadata: true },
    });

    const metadata = this.parseMetadata(org?.metadata);
    return {
      ...DEFAULT_GENERAL_SETTINGS,
      ...metadata.generalSettings,
    };
  }

  /**
   * 更新租户系统基础设置偏好
   */
  async updateGeneralSettings(
    organizationId: string,
    input: UpdateGeneralSettingsInput,
  ): Promise<GeneralSettingsData> {
    if (
      input.defaultPageSize !== undefined &&
      (input.defaultPageSize <= 0 || input.defaultPageSize > 500)
    ) {
      throw new Error("每页展示行数必须在 1 至 500 之间");
    }

    if (
      input.amountPrecision !== undefined &&
      (input.amountPrecision < 0 || input.amountPrecision > 6)
    ) {
      throw new Error("金额小数位数必须在 0 至 6 之间");
    }

    const org = await this.controlPrisma.organization.findUnique({
      where: { id: organizationId },
      select: { metadata: true },
    });

    const metadata = this.parseMetadata(org?.metadata);
    const updatedGeneral: GeneralSettingsData = {
      ...DEFAULT_GENERAL_SETTINGS,
      ...metadata.generalSettings,
      ...(input.systemName === undefined
        ? {}
        : { systemName: input.systemName.trim() }),
      ...(input.defaultPageSize === undefined
        ? {}
        : { defaultPageSize: input.defaultPageSize }),
      ...(input.orderPrefix === undefined
        ? {}
        : { orderPrefix: input.orderPrefix.trim() }),
      ...(input.dateFormat === undefined
        ? {}
        : { dateFormat: input.dateFormat.trim() }),
      ...(input.amountPrecision === undefined
        ? {}
        : { amountPrecision: input.amountPrecision }),
    };

    metadata.generalSettings = updatedGeneral;

    await this.controlPrisma.organization.update({
      where: { id: organizationId },
      data: { metadata: JSON.stringify(metadata) },
    });

    return updatedGeneral;
  }

  /**
   * 读取租户安全策略配置
   */
  async getSecuritySettings(
    organizationId: string,
  ): Promise<SecuritySettingsData> {
    const org = await this.controlPrisma.organization.findUnique({
      where: { id: organizationId },
      select: { metadata: true },
    });

    const metadata = this.parseMetadata(org?.metadata);
    return {
      ...DEFAULT_SECURITY_SETTINGS,
      ...metadata.securitySettings,
    };
  }

  /**
   * 更新租户安全策略配置
   */
  async updateSecuritySettings(
    organizationId: string,
    input: UpdateSecuritySettingsInput,
  ): Promise<SecuritySettingsData> {
    if (
      input.sessionIdleTimeoutMinutes !== undefined &&
      input.sessionIdleTimeoutMinutes < 5
    ) {
      throw new Error("会话闲置超时时间不能低于 5 分钟");
    }

    if (
      input.passwordMinLength !== undefined &&
      (input.passwordMinLength < 6 || input.passwordMinLength > 32)
    ) {
      throw new Error("密码最小长度必须在 6 至 32 之间");
    }

    const org = await this.controlPrisma.organization.findUnique({
      where: { id: organizationId },
      select: { metadata: true },
    });

    const metadata = this.parseMetadata(org?.metadata);
    const updatedSecurity: SecuritySettingsData = {
      ...DEFAULT_SECURITY_SETTINGS,
      ...metadata.securitySettings,
      ...(input.sessionIdleTimeoutMinutes === undefined
        ? {}
        : { sessionIdleTimeoutMinutes: input.sessionIdleTimeoutMinutes }),
      ...(input.forceChangeInitialPassword === undefined
        ? {}
        : {
            forceChangeInitialPassword: input.forceChangeInitialPassword,
          }),
      ...(input.passwordMinLength === undefined
        ? {}
        : { passwordMinLength: input.passwordMinLength }),
      ...(input.requireSpecialChar === undefined
        ? {}
        : { requireSpecialChar: input.requireSpecialChar }),
    };

    metadata.securitySettings = updatedSecurity;

    await this.controlPrisma.organization.update({
      where: { id: organizationId },
      data: { metadata: JSON.stringify(metadata) },
    });

    return updatedSecurity;
  }

  /** 解析组织元数据 JSON 辅助方法 */
  private parseMetadata(
    rawMetadata?: string | null,
  ): OrganizationMetadataContainer {
    if (!rawMetadata) {
      return {};
    }
    try {
      const parsed = JSON.parse(rawMetadata);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as OrganizationMetadataContainer;
      }
      return {};
    } catch {
      return {};
    }
  }
}
