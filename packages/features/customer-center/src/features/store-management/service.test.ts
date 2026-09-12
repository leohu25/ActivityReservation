import test from "node:test";
import assert from "node:assert/strict";
import { CustomerStoreService } from "./service";

test("CustomerStoreService 拒绝在停用客户下创建门店", async () => {
  await assert.rejects(
    CustomerStoreService.createStore(
      {
        customer: {
          findUnique: async () => ({
            customerName: "停用客户",
            status: "DISABLED",
          }),
        },
      } as never,
      {
        customerCode: "CUST-001",
        storeName: "一号店",
        address: "测试路 1 号",
        contactPerson: "张三",
        contactPhone: "13800000000",
        regionCode: "REGION-01",
      },
    ),
    /已停用/,
  );
});
