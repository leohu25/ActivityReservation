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
  systemName: "企业数字化协同平台",
  logoUrl: null,
  companyName: "杭州示范制造科技有限公司",
  shortName: "示范制造",
  creditCode: "91330100MA2XXXXX",
  legalPerson: "张三",
  contactPhone: "0571-88888888",
  contactEmail: "service@example.com",
  address: "浙江省杭州市余杭区仓前街道",
  timezone: "Asia/Shanghai",
  currency: "CNY",
};

const mockGeneralData: GeneralSettingsData = {
  systemName: "示范数智供应链协同系统",
  defaultPageSize: 20,
  orderPrefix: "DEMO-DOC-",
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
    assert.match(html, /基础设施配置/);
    assert.match(html, /系统外观与品牌标识/);
    assert.match(html, /杭州示范制造科技有限公司/);
    assert.match(html, /ID: comp_123/);
  });

  it("renders GeneralSettingsView with controlled data and comboboxes", () => {
    const html = renderToStaticMarkup(
      <GeneralSettingsView data={mockGeneralData} />,
    );
    assert.match(html, /基础偏好设置/);
    assert.match(html, /示范数智供应链协同系统/);
    assert.match(html, /DEMO-DOC-/);
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
