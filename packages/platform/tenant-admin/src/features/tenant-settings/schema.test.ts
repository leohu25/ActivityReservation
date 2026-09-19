import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  updateCompanyProfileSchema,
  updateGeneralSettingsSchema,
  updateSecuritySettingsSchema,
} from "./schema";

describe("tenant-settings schemas", () => {
  describe("updateCompanyProfileSchema", () => {
    it("should validate valid company profile", () => {
      const parsed = updateCompanyProfileSchema.parse({
        companyName: "宸润制造科技集团",
        creditCode: "91320000XXXXXXXXXX",
        contactEmail: "admin@chenrun.com",
      });
      assert.equal(parsed.companyName, "宸润制造科技集团");
      assert.equal(parsed.currency, "CNY");
      assert.equal(parsed.timezone, "Asia/Shanghai");
    });

    it("should reject empty company name", () => {
      assert.throws(() => {
        updateCompanyProfileSchema.parse({
          companyName: "   ",
        });
      });
    });
  });

  describe("updateGeneralSettingsSchema", () => {
    it("should validate and apply defaults for general settings", () => {
      const parsed = updateGeneralSettingsSchema.parse({});
      assert.equal(parsed.systemName, "宸润数智 ERP");
      assert.equal(parsed.defaultPageSize, 10);
      assert.equal(parsed.amountPrecision, 2);
    });

    it("should reject invalid pageSize", () => {
      assert.throws(() => {
        updateGeneralSettingsSchema.parse({
          defaultPageSize: 15,
        });
      });
    });
  });

  describe("updateSecuritySettingsSchema", () => {
    it("should validate valid security settings", () => {
      const parsed = updateSecuritySettingsSchema.parse({
        sessionIdleTimeoutMinutes: 30,
        passwordMinLength: 10,
      });
      assert.equal(parsed.sessionIdleTimeoutMinutes, 30);
      assert.equal(parsed.passwordMinLength, 10);
      assert.equal(parsed.forceChangeInitialPassword, true);
    });

    it("should reject timeout outside allowed enum", () => {
      assert.throws(() => {
        updateSecuritySettingsSchema.parse({
          sessionIdleTimeoutMinutes: 45,
        });
      });
    });
  });
});
