import test from "node:test";
import assert from "node:assert/strict";
import type { ControlPrismaClient } from "@base/db-control";
import type { TenantPrismaClient } from "@base/db-tenant";
import {
  TenantSettingsService,
  DEFAULT_GENERAL_SETTINGS,
  DEFAULT_SECURITY_SETTINGS,
} from "./service";

test("TenantSettingsService 读写企业资料 (CompanyProfile) 与平台 Organization 组织名同步", async () => {
  let orgName = "初始演示企业";
  let orgMetadata: string | null = null;
  let companyProfileRecord: {
    id: string;
    companyName: string;
    shortName: string | null;
    creditCode: string | null;
    legalPerson: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    address: string | null;
    timezone: string;
    currency: string;
    createdAt: Date;
    updatedAt: Date;
  } | null = null;

  const mockControlPrisma = {
    organization: {
      async findUnique({ where }: { where: { id: string } }) {
        if (where.id === "org_test") {
          return { id: "org_test", name: orgName, metadata: orgMetadata };
        }
        return null;
      },
      async update({
        where,
        data,
      }: {
        where: { id: string };
        data: { name?: string; metadata?: string };
      }) {
        if (where.id === "org_test") {
          if (data.name !== undefined) orgName = data.name;
          if (data.metadata !== undefined) orgMetadata = data.metadata;
          return { id: "org_test", name: orgName, metadata: orgMetadata };
        }
        throw new Error("Org not found");
      },
    },
  } as unknown as ControlPrismaClient;

  const mockTenantPrisma = {
    companyProfile: {
      async findFirst() {
        return companyProfileRecord;
      },
      async create({ data }: { data: Record<string, unknown> }) {
        companyProfileRecord = {
          id: "cp_1",
          companyName: String(data.companyName),
          shortName: (data.shortName as string) ?? null,
          creditCode: (data.creditCode as string) ?? null,
          legalPerson: (data.legalPerson as string) ?? null,
          contactPhone: (data.contactPhone as string) ?? null,
          contactEmail: (data.contactEmail as string) ?? null,
          address: (data.address as string) ?? null,
          timezone: (data.timezone as string) ?? "Asia/Shanghai",
          currency: (data.currency as string) ?? "CNY",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return companyProfileRecord;
      },
      async update({ data }: { data: Record<string, unknown> }) {
        if (!companyProfileRecord) throw new Error("No record");
        companyProfileRecord = {
          ...companyProfileRecord,
          ...data,
          updatedAt: new Date(),
        } as typeof companyProfileRecord;
        return companyProfileRecord;
      },
    },
  } as unknown as TenantPrismaClient;

  const service = new TenantSettingsService(
    mockControlPrisma,
    async () => mockTenantPrisma,
  );

  // 1. 当租户库暂无企业资料时，回退并返回默认档案（使用 Control DB 中的组织名）
  const initial = await service.getCompanyProfile("org_test");
  assert.equal(initial.companyName, "初始演示企业");
  assert.equal(initial.currency, "CNY");
  assert.equal(initial.timezone, "Asia/Shanghai");

  // 2. 首次写入企业资料 (触发 create)
  const created = await service.updateCompanyProfile("org_test", {
    companyName: "宸润数智工业制造有限公司",
    shortName: "宸润数智",
    creditCode: "914403001922038216",
    legalPerson: "郭顺顺",
    contactPhone: "13800138000",
    contactEmail: "admin@qq.com",
    address: "浙江省杭州市高新数智产业园A座",
    currency: "CNY",
    timezone: "Asia/Shanghai",
  });

  assert.equal(created.companyName, "宸润数智工业制造有限公司");
  assert.equal(created.shortName, "宸润数智");
  assert.equal(created.creditCode, "914403001922038216");
  assert.equal(created.legalPerson, "郭顺顺");
  // 验证 Control DB 的组织名称被同步更新
  assert.equal(orgName, "宸润数智工业制造有限公司");

  // 3. 再次更新企业资料 (触发 update)
  const updated = await service.updateCompanyProfile("org_test", {
    companyName: "宸润数智工业全球控股",
    shortName: "宸润控股",
    creditCode: "914403001922038216",
  });
  assert.equal(updated.companyName, "宸润数智工业全球控股");
  assert.equal(updated.shortName, "宸润控股");
  assert.equal(orgName, "宸润数智工业全球控股");

  // 4. 输入空企业名称时校验拦截
  await assert.rejects(
    () => service.updateCompanyProfile("org_test", { companyName: "   " }),
    /企业名称不能为空/,
  );
});

test("TenantSettingsService 读写基础偏好设置 (GeneralSettings)", async () => {
  let orgMetadata: string | null = null;

  const mockControlPrisma = {
    organization: {
      async findUnique({ where }: { where: { id: string } }) {
        if (where.id === "org_test") {
          return { id: "org_test", name: "测试企业", metadata: orgMetadata };
        }
        return null;
      },
      async update({
        where,
        data,
      }: {
        where: { id: string };
        data: { metadata?: string };
      }) {
        if (where.id === "org_test") {
          if (data.metadata !== undefined) orgMetadata = data.metadata;
          return { id: "org_test", metadata: orgMetadata };
        }
        throw new Error("Org not found");
      },
    },
  } as unknown as ControlPrismaClient;

  const service = new TenantSettingsService(
    mockControlPrisma,
    async () => ({}) as TenantPrismaClient,
  );

  // 1. 默认设置读取
  const defaultGeneral = await service.getGeneralSettings("org_test");
  assert.equal(defaultGeneral.systemName, DEFAULT_GENERAL_SETTINGS.systemName);
  assert.equal(defaultGeneral.defaultPageSize, 10);
  assert.equal(defaultGeneral.orderPrefix, "PO-");

  // 2. 更新基础设置
  const updatedGeneral = await service.updateGeneralSettings("org_test", {
    systemName: "晨润数字化协同底座",
    defaultPageSize: 50,
    orderPrefix: "PUR-",
    amountPrecision: 3,
  });

  assert.equal(updatedGeneral.systemName, "晨润数字化协同底座");
  assert.equal(updatedGeneral.defaultPageSize, 50);
  assert.equal(updatedGeneral.orderPrefix, "PUR-");
  assert.equal(updatedGeneral.amountPrecision, 3);

  // 3. 再次读取验证持久化成功
  const reread = await service.getGeneralSettings("org_test");
  assert.equal(reread.systemName, "晨润数字化协同底座");
  assert.equal(reread.orderPrefix, "PUR-");

  // 4. 边界校验：非法分页大小与非法小数精度
  await assert.rejects(
    () => service.updateGeneralSettings("org_test", { defaultPageSize: 0 }),
    /每页展示行数必须在 1 至 500 之间/,
  );
  await assert.rejects(
    () => service.updateGeneralSettings("org_test", { amountPrecision: 9 }),
    /金额小数位数必须在 0 至 6 之间/,
  );
});

test("TenantSettingsService 读写安全策略设置 (SecuritySettings)", async () => {
  let orgMetadata: string | null = null;

  const mockControlPrisma = {
    organization: {
      async findUnique({ where }: { where: { id: string } }) {
        if (where.id === "org_test") {
          return { id: "org_test", name: "测试企业", metadata: orgMetadata };
        }
        return null;
      },
      async update({
        where,
        data,
      }: {
        where: { id: string };
        data: { metadata?: string };
      }) {
        if (where.id === "org_test") {
          if (data.metadata !== undefined) orgMetadata = data.metadata;
          return { id: "org_test", metadata: orgMetadata };
        }
        throw new Error("Org not found");
      },
    },
  } as unknown as ControlPrismaClient;

  const service = new TenantSettingsService(
    mockControlPrisma,
    async () => ({}) as TenantPrismaClient,
  );

  // 1. 默认安全策略读取
  const defaultSec = await service.getSecuritySettings("org_test");
  assert.equal(
    defaultSec.sessionIdleTimeoutMinutes,
    DEFAULT_SECURITY_SETTINGS.sessionIdleTimeoutMinutes,
  );
  assert.equal(defaultSec.forceChangeInitialPassword, true);

  // 2. 更新安全设置
  const updatedSec = await service.updateSecuritySettings("org_test", {
    sessionIdleTimeoutMinutes: 30,
    forceChangeInitialPassword: false,
    passwordMinLength: 10,
    requireSpecialChar: true,
  });

  assert.equal(updatedSec.sessionIdleTimeoutMinutes, 30);
  assert.equal(updatedSec.forceChangeInitialPassword, false);
  assert.equal(updatedSec.passwordMinLength, 10);

  // 3. 再次读取验证生效
  const rereadSec = await service.getSecuritySettings("org_test");
  assert.equal(rereadSec.sessionIdleTimeoutMinutes, 30);
  assert.equal(rereadSec.passwordMinLength, 10);

  // 4. 边界校验：过小的超时时间或不合规的密码最小长度
  await assert.rejects(
    () =>
      service.updateSecuritySettings("org_test", {
        sessionIdleTimeoutMinutes: 2,
      }),
    /会话闲置超时时间不能低于 5 分钟/,
  );
  await assert.rejects(
    () => service.updateSecuritySettings("org_test", { passwordMinLength: 3 }),
    /密码最小长度必须在 6 至 32 之间/,
  );
});
