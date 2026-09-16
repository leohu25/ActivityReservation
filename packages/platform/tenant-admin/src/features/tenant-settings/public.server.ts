import "server-only";

export {
  getCompanyProfileQuery,
  getGeneralSettingsQuery,
  getSecuritySettingsQuery,
} from "./queries";
export {
  getCompanyProfileAction,
  updateCompanyProfileAction,
  getGeneralSettingsAction,
  updateGeneralSettingsAction,
  getSecuritySettingsAction,
  updateSecuritySettingsAction,
} from "./actions";
export {
  TenantSettingsService,
  DEFAULT_GENERAL_SETTINGS,
  DEFAULT_SECURITY_SETTINGS,
} from "./service";
