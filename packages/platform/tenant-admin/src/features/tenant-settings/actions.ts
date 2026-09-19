"use server";
import { StandardAction } from "@base/authorization";

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
import {
  updateCompanyProfileSchema,
  updateGeneralSettingsSchema,
  updateSecuritySettingsSchema,
  type UpdateCompanyProfileSchemaInput,
  type UpdateGeneralSettingsSchemaInput,
  type UpdateSecuritySettingsSchemaInput,
} from "./schema";
import { TenantSettingsService } from "./service";
import type {
  CompanyProfileData,
  GeneralSettingsData,
  SecuritySettingsData,
} from "./types";

/** 获取企业信息 Server Action */
export const getCompanyProfileAction = defineServerAction(
  async (): Promise<CompanyProfileData> => {
    const { organizationId, client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, StandardAction.READ, CompanyProfileSubject);

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
  async (input: UpdateCompanyProfileSchemaInput): Promise<CompanyProfileData> => {
    const validated = updateCompanyProfileSchema.parse(input);
    const { organizationId, client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, StandardAction.UPDATE, CompanyProfileSubject);

    const controlPrisma = await getControlDbClient();
    const service = new TenantSettingsService(
      controlPrisma,
      async () => client,
    );
    const data = await service.updateCompanyProfile(organizationId, validated);

    revalidatePath("/settings/company");
    return data;
  },
  "更新企业信息失败",
);

/** 获取基础设置 Server Action */
export const getGeneralSettingsAction = defineServerAction(
  async (): Promise<GeneralSettingsData> => {
    const { organizationId, client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, StandardAction.READ, GeneralSettingsSubject);

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
  async (input: UpdateGeneralSettingsSchemaInput): Promise<GeneralSettingsData> => {
    const validated = updateGeneralSettingsSchema.parse(input);
    const { organizationId, client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, StandardAction.UPDATE, GeneralSettingsSubject);

    const controlPrisma = await getControlDbClient();
    const service = new TenantSettingsService(
      controlPrisma,
      async () => client,
    );
    const data = await service.updateGeneralSettings(organizationId, validated);

    revalidatePath("/settings/general");
    return data;
  },
  "更新基础设置失败",
);

/** 获取安全设置 Server Action */
export const getSecuritySettingsAction = defineServerAction(
  async (): Promise<SecuritySettingsData> => {
    const { organizationId, client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, StandardAction.READ, SecuritySettingsSubject);

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
  async (input: UpdateSecuritySettingsSchemaInput): Promise<SecuritySettingsData> => {
    const validated = updateSecuritySettingsSchema.parse(input);
    const { organizationId, client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, StandardAction.UPDATE, SecuritySettingsSubject);

    const controlPrisma = await getControlDbClient();
    const service = new TenantSettingsService(
      controlPrisma,
      async () => client,
    );
    const data = await service.updateSecuritySettings(organizationId, validated);

    revalidatePath("/settings/security");
    return data;
  },
  "更新安全设置失败",
);
