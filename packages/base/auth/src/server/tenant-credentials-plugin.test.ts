import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword } from "better-auth/crypto";
import { tenantCredentialsPlugin } from "./tenant-credentials-plugin";
import type { ControlPrismaClient } from "@base/db-control";

test("tenantCredentialsPlugin 官方标准插件端点与认证逻辑", async () => {
  const hashedPassword = await hashPassword("MySecret123!");

  const fakePrisma = {
    organization: {
      async findUnique({ where }: { where: { slug?: string } }) {
        if (where.slug === "huawei") {
          return { id: "org_hw_001", name: "华为技术", slug: "huawei" };
        }
        return null;
      },
    },
    tenantAccount: {
      async findUnique({
        where,
      }: {
        where: { organizationId_account: { organizationId: string; account: string } };
      }) {
        const { organizationId, account } = where.organizationId_account;
        if (organizationId === "org_hw_001" && account === "001@qq.com") {
          return {
            id: "acc_001",
            organizationId,
            account: "001@qq.com",
            password: hashedPassword,
            name: "张三",
            memberId: "mem_001",
            status: "ACTIVE",
          };
        }
        if (organizationId === "org_hw_001" && account === "disabled_user") {
          return {
            id: "acc_002",
            organizationId,
            account: "disabled_user",
            password: hashedPassword,
            name: "停用员工",
            memberId: "mem_002",
            status: "DISABLED",
          };
        }
        return null;
      },
    },
    member: {
      async findUnique({ where }: { where: { id: string } }) {
        if (where.id === "mem_001") {
          return { id: "mem_001", userId: "usr_001" };
        }
        return null;
      },
    },
    session: {
      async update() {
        return {};
      },
    },
  } as unknown as ControlPrismaClient;

  const plugin = tenantCredentialsPlugin({ prisma: fakePrisma });
  assert.equal(plugin.id, "tenant-credentials");
  assert.ok(plugin.endpoints.signInTenant);
});
