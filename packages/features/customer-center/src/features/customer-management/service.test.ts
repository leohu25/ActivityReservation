import test from "node:test";
import assert from "node:assert/strict";
import { CustomerService } from "./service";

test("CustomerService 自动递增编码并级联停用门店", async () => {
  const today = new Date();
  const prefix = `CUST-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}-`;
  const code = await CustomerService.generateCustomerCode({
    customer: { findFirst: async () => ({ customerCode: `${prefix}0008` }) },
  } as never);
  assert.equal(code, `${prefix}0009`);

  let storesStatus = "";
  await CustomerService.updateCustomerStatus(
    {
      $transaction: async (fn: (tx: unknown) => unknown) =>
        fn({
          customer: {
            update: async ({ data }: { data: { status: string } }) => data,
          },
          customerStore: {
            updateMany: async ({ data }: { data: { status: string } }) => {
              storesStatus = data.status;
            },
          },
        }),
    } as never,
    "CUST-001",
    "DISABLED",
  );
  assert.equal(storesStatus, "DISABLED");
});

test("CustomerService 拒绝删除有关联门店的客户", async () => {
  await assert.rejects(
    CustomerService.deleteCustomer(
      {
        customerStore: { count: async () => 1 },
        customerQuote: { count: async () => 0 },
      } as never,
      "CUST-001",
    ),
    /禁止删除/,
  );
});
