import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  provisionTenantSchema,
  parseProvisionTenantInput,
} from "./schema";

describe("tenant-management.schema", () => {
  it("合法开通参数能够正常通过校验", () => {
    const input = {
      name: "辰润测试租户",
      slug: "chenrun-test",
      adminEmail: "admin@chenrun.com",
      adminName: "超管",
      clusterCode: "primary",
    };
    const parsed = parseProvisionTenantInput(input);
    assert.equal(parsed.name, "辰润测试租户");
    assert.equal(parsed.slug, "chenrun-test");
    assert.equal(parsed.adminEmail, "admin@chenrun.com");
  });

  it("缺省非必填项赋予默认值", () => {
    const res = provisionTenantSchema.safeParse({
      name: "最小租户",
      slug: "min-tenant",
      adminEmail: "admin@min.com",
    });
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.clusterCode, "primary");
      assert.equal(res.data.adminName, "");
      assert.equal(res.data.initialPassword, "");
    }
  });

  it("非法 Slug 格式或大写字母被拦截", () => {
    assert.throws(() => {
      parseProvisionTenantInput({
        name: "测试租户",
        slug: "Chenrun_Test!",
        adminEmail: "admin@chenrun.com",
      });
    });
  });

  it("非法邮箱格式被拦截", () => {
    assert.throws(() => {
      parseProvisionTenantInput({
        name: "测试租户",
        slug: "chenrun-test",
        adminEmail: "not-an-email",
      });
    });
  });
});
