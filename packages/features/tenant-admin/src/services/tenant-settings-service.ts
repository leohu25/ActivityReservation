import type { ControlPrismaClient } from "@chenrun/db-control";
import type { TenantPrismaClient } from "@chenrun/db-tenant";
import type {
  CompanyProfileData,
  UpdateCompanyProfileInput,
  GeneralSettingsData,
  UpdateGeneralSettingsInput,
  SecuritySettingsData,
  UpdateSecuritySettingsInput,
} from "../types";

/** 租户基础设置默认值 */
export const DEFAULT_GENERAL_SETTINGS: GeneralSettingsData = {
  systemName: "宸润数智 ERP",
  defaultPageSize: 10,
  orderPrefix: "PO-",
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
   * 读取租户企业扩展资料
   */
  async getCompanyProfile(organizationId: string): Promise<CompanyProfileData> {
    const tenantPrisma = await this.tenantDbResolver(organizationId);
    const profile = await tenantPrisma.companyProfile.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (profile) {
      return {
        id: profile.id,
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

    // 默认回退：读取 Control DB 中的 Organization 注册名称
    const org = await this.controlPrisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });

    return {
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
   * 更新或新建租户企业扩展资料
   */
  async updateCompanyProfile(
    organizationId: string,
    input: UpdateCompanyProfileInput,
  ): Promise<CompanyProfileData> {
    const cleanCompanyName = input.companyName?.trim();
    if (!cleanCompanyName) {
      throw new Error("企业名称不能为空");
    }

    const tenantPrisma = await this.tenantDbResolver(organizationId);
    const existing = await tenantPrisma.companyProfile.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const updatePayload = {
      companyName: cleanCompanyName,
      shortName: input.shortName?.trim() || null,
      creditCode: input.creditCode?.trim() || null,
      legalPerson: input.legalPerson?.trim() || null,
      contactPhone: input.contactPhone?.trim() || null,
      contactEmail: input.contactEmail?.trim() || null,
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

    // 同步更新 Control DB 中 Organization 的展示名称
    await this.controlPrisma.organization.update({
      where: { id: organizationId },
      data: { name: cleanCompanyName },
    });

    return {
      id: savedProfile.id,
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
            forceChangeInitialPassword:
              input.forceChangeInitialPassword,
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
  private parseMetadata(rawMetadata?: string | null): OrganizationMetadataContainer {
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
