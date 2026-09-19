import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { UiAbilityProvider } from "@base/ui";
import { CompanySettingsView } from "./CompanySettingsView";
import { GeneralSettingsView } from "./GeneralSettingsView";
import { SecuritySettingsView } from "./SecuritySettingsView";
import type {
  CompanyProfileData,
  GeneralSettingsData,
  SecuritySettingsData,
} from "../types";

const mockAbility = {
  can: () => true,
};

const mockCompanyData: CompanyProfileData = {
  id: "comp_123",
  companyName: "杭州宸润制造科技有限公司",
  shortName: "宸润制造",
  creditCode: "91330100MA2XXXXX",
  legalPerson: "张三",
  contactPhone: "0571-88888888",
  contactEmail: "service@chenrun.com",
  address: "浙江省杭州市余杭区仓前街道",
  timezone: "Asia/Shanghai",
  currency: "CNY",
};

const mockGeneralData: GeneralSettingsData = {
  systemName: "宸润数智供应链协同系统",
  defaultPageSize: 20,
  orderPrefix: "CR-PO-",
  dateFormat: "YYYY/MM/DD",
  amountPrecision: 3,
};

const mockSecurityData: SecuritySettingsData = {
  sessionIdleTimeoutMinutes: 30,
  forceChangeInitialPassword: true,
  passwordMinLength: 10,
  requireSpecialChar: true,
};

describe("tenant-settings UI views", () => {
  it("renders CompanySettingsView with controlled data", () => {
    const html = renderToStaticMarkup(
      <UiAbilityProvider ability={mockAbility}>
        <CompanySettingsView data={mockCompanyData} />
      </UiAbilityProvider>,
    );
    assert.match(html, /企业信息管理/);
    assert.match(html, /杭州宸润制造科技有限公司/);
    assert.match(html, /ID: comp_123/);
  });

  it("renders GeneralSettingsView with controlled data and comboboxes", () => {
    const html = renderToStaticMarkup(
      <GeneralSettingsView data={mockGeneralData} />,
    );
    assert.match(html, /基础偏好设置/);
    assert.match(html, /宸润数智供应链协同系统/);
    assert.match(html, /CR-PO-/);
  });

  it("renders SecuritySettingsView with controlled data and comboboxes", () => {
    const html = renderToStaticMarkup(
      <SecuritySettingsView data={mockSecurityData} />,
    );
    assert.match(html, /企业安全设置/);
    assert.match(html, /会话超时管理/);
    assert.match(html, /首次登录强制修改初始密码/);
  });
});
