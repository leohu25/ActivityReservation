import test from "node:test";
import assert from "node:assert/strict";
import { PlatformOverviewService } from "./service";
import type { ControlPrismaClient } from "@chenrun/db-control";

test("PlatformOverviewService 大盘统计与超管鉴权", async () => {
  const fakePrisma = {
    organization: {
      async findMany() {
        return [
          {
            id: "org_1",
            tenantDatabase: { status: "ACTIVE" },
          },
          {
            id: "org_2",
            tenantDatabase: { status: "SUSPENDED" },
          },
          {
            id: "org_3",
            tenantDatabase: null,
          },
        ];
      },
    },
  } as unknown as ControlPrismaClient;

  const service = new PlatformOverviewService(fakePrisma);

  const superAdmin = { email: "admin@qq.com" };
  const normalUser = { email: "attacker@test.com" };

  await assert.rejects(
    async () => {
      await service.getStats(normalUser);
    },
    { message: /需要控制平面超级管理员权限/ },
  );

  const stats = await service.getStats(superAdmin);
  assert.equal(stats.totalTenants, 3);
  assert.equal(stats.activeTenants, 1);
  assert.equal(stats.suspendedTenants, 1);
});
