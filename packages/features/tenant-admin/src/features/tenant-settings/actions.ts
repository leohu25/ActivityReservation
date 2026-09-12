"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import {
  getTenantAdminContext,
  assertTenantAdminAbility,
} from "../../assembly/context";
import { getControlDbClient } from "../../shared/server/tenant-context";
import {
  CompanyProfileSubject,
  GeneralSettingsSubject,
  SecuritySettingsSubject,
} from "./contract";
import { TenantSettingsService } from "./service";
import type {
  CompanyProfileData,
  UpdateCompanyProfileInput,
  GeneralSettingsData,
  UpdateGeneralSettingsInput,
  SecuritySettingsData,
  UpdateSecuritySettingsInput,
} from "./types";

/** 获取企业信息 Server Action */
export const getCompanyProfileAction = defineServerAction(
  async (): Promise<CompanyProfileData> => {
    const { organizationId, client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "read", CompanyProfileSubject);

    const controlPrisma = await getControlDbClient();
    const service = new TenantSettingsService(
      controlPrisma,
      async () => client,
    );
    return service.getCompanyProfile(organizationId);
  },
  "获取企业信息失败",
);

/** 更新企业信息 Server Action */
export const updateCompanyProfileAction = defineServerAction(
  async (input: UpdateCompanyProfileInput): Promise<CompanyProfileData> => {
    const { organizationId, client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "update", CompanyProfileSubject);

    const controlPrisma = await getControlDbClient();
    const service = new TenantSettingsService(
      controlPrisma,
      async () => client,
    );
    const data = await service.updateCompanyProfile(organizationId, input);

    revalidatePath("/settings/company");
    return data;
  },
  "更新企业信息失败",
);

/** 获取基础设置 Server Action */
export const getGeneralSettingsAction = defineServerAction(
  async (): Promise<GeneralSettingsData> => {
    const { organizationId, client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "read", GeneralSettingsSubject);

    const controlPrisma = await getControlDbClient();
    const service = new TenantSettingsService(
      controlPrisma,
      async () => client,
    );
    return service.getGeneralSettings(organizationId);
  },
  "获取基础设置失败",
);

/** 更新基础设置 Server Action */
export const updateGeneralSettingsAction = defineServerAction(
  async (input: UpdateGeneralSettingsInput): Promise<GeneralSettingsData> => {
    const { organizationId, client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "update", GeneralSettingsSubject);

    const controlPrisma = await getControlDbClient();
    const service = new TenantSettingsService(
      controlPrisma,
      async () => client,
    );
    const data = await service.updateGeneralSettings(organizationId, input);

    revalidatePath("/settings/general");
    return data;
  },
  "更新基础设置失败",
);

/** 获取安全设置 Server Action */
export const getSecuritySettingsAction = defineServerAction(
  async (): Promise<SecuritySettingsData> => {
    const { organizationId, client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "read", SecuritySettingsSubject);

    const controlPrisma = await getControlDbClient();
    const service = new TenantSettingsService(
      controlPrisma,
      async () => client,
    );
    return service.getSecuritySettings(organizationId);
  },
  "获取安全设置失败",
);

/** 更新安全设置 Server Action */
export const updateSecuritySettingsAction = defineServerAction(
  async (input: UpdateSecuritySettingsInput): Promise<SecuritySettingsData> => {
    const { organizationId, client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "update", SecuritySettingsSubject);

    const controlPrisma = await getControlDbClient();
    const service = new TenantSettingsService(
      controlPrisma,
      async () => client,
    );
    const data = await service.updateSecuritySettings(organizationId, input);

    revalidatePath("/settings/security");
    return data;
  },
  "更新安全设置失败",
);
