import { StandardAction } from "@base/authorization";
import "server-only";

import { toPlainData } from "@base/shared";
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
  GeneralSettingsData,
  SecuritySettingsData,
} from "./types";

export async function getCompanyProfileQuery(): Promise<CompanyProfileData> {
  const { organizationId, client, ability } = await getTenantAdminContext();
  assertTenantAdminAbility(ability, StandardAction.READ, CompanyProfileSubject);

  const controlPrisma = await getControlDbClient();
  const service = new TenantSettingsService(controlPrisma, async () => client);
  const profile = await service.getCompanyProfile(organizationId);

  return toPlainData(profile);
}

export async function getGeneralSettingsQuery(): Promise<GeneralSettingsData> {
  const { organizationId, client, ability } = await getTenantAdminContext();
  assertTenantAdminAbility(ability, StandardAction.READ, GeneralSettingsSubject);

  const controlPrisma = await getControlDbClient();
  const service = new TenantSettingsService(controlPrisma, async () => client);
  const settings = await service.getGeneralSettings(organizationId);

  return toPlainData(settings);
}

export async function getSecuritySettingsQuery(): Promise<SecuritySettingsData> {
  const { organizationId, client, ability } = await getTenantAdminContext();
  assertTenantAdminAbility(ability, StandardAction.READ, SecuritySettingsSubject);

  const controlPrisma = await getControlDbClient();
  const service = new TenantSettingsService(controlPrisma, async () => client);
  const settings = await service.getSecuritySettings(organizationId);

  return toPlainData(settings);
}
