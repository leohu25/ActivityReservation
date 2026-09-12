import test from "node:test";
import assert from "node:assert/strict";
import { MigrationManagementService } from "./service";
import type { ControlPrismaClient } from "@chenrun/db-control";

test("MigrationManagementService 鉴权守卫与看板降级返回", async () => {
  const fakePrisma = {
    organization: {
      async findMany() {
        return [];
      },
    },
  } as unknown as ControlPrismaClient;

  const service = new MigrationManagementService(fakePrisma);

  const superAdmin = { email: "admin@qq.com" };
  const normalUser = { email: "attacker@fake.com" };

  await assert.rejects(
    async () => {
      await service.getMigrationDashboard(normalUser);
    },
    { message: /需要控制平面超级管理员权限/ },
  );

  const dashboard = await service.getMigrationDashboard(superAdmin);
  assert.ok(dashboard);
  assert.equal(dashboard.platform.isUpToDate, true);
  assert.equal(dashboard.fleet.totalCount, 0);
});
