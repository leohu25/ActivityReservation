import test from "node:test";
import assert from "node:assert/strict";
import { CustomerQuoteService } from "./service";

test("CustomerQuoteService 报价优先级为门店、客户、区域", async () => {
  const result = await CustomerQuoteService.resolvePrice(
    {
      customerQuoteItem: {
        findFirst: async ({
          where,
        }: {
          where: { quote: { storeCode?: string } };
        }) => (where.quote.storeCode ? { unitPriceInclTax: 5 } : null),
      },
    } as never,
    {
      itemCode: "ITEM-1",
      customerCode: "CUST-1",
      storeCode: "STORE-1",
      regionCode: "REGION-1",
    },
  );
  assert.equal(result?.priority, "STORE");
});

test("CustomerQuoteService 仅允许草稿报价生效", async () => {
  await assert.rejects(
    CustomerQuoteService.updateQuoteStatus(
      {
        customerQuote: {
          findUnique: async () => ({ status: "ACTIVE", isDeleted: false }),
        },
      } as never,
      "QUOTE-1",
      "ACTIVE",
    ),
    /仅“草稿”状态/,
  );
});

test("CustomerQuoteService 拦截非草稿状态的编辑操作", async () => {
  await assert.rejects(
    CustomerQuoteService.updateQuote(
      {
        customerQuote: {
          findUnique: async () => ({ status: "ACTIVE", isDeleted: false }),
        },
      } as never,
      "QUOTE-ACTIVE-1",
      {
        effectiveDate: "2026-09-01",
        items: [
          {
            itemCode: "ITEM-1",
            itemName: "生菜",
            salesUnit: "kg",
            unitPriceExclTax: 5,
            unitPriceInclTax: 5.45,
            taxRate: 9,
          },
        ],
      },
    ),
    /仅“草稿”状态的报价单允许编辑/,
  );
});

test("CustomerQuoteService 拦截非草稿状态的删除操作，执行草稿软删除", async () => {
  // 1. 已生效单据禁止删除
  await assert.rejects(
    CustomerQuoteService.deleteQuote(
      {
        customerQuote: {
          findUnique: async () => ({ status: "ACTIVE", isDeleted: false }),
        },
      } as never,
      "QUOTE-ACTIVE-1",
    ),
    /仅“草稿”状态的报价单支持删除/,
  );

  // 2. 草稿单据执行软删除 (isDeleted: true)
  let updatedPayload: any = null;
  const mockClient = {
    customerQuote: {
      findUnique: async () => ({ status: "DRAFT", isDeleted: false }),
      update: async ({ data }: any) => {
        updatedPayload = data;
        return { quoteId: "QUOTE-DRAFT-1", ...data };
      },
    },
  };

  await CustomerQuoteService.deleteQuote(mockClient as never, "QUOTE-DRAFT-1", {
    userId: "user-operator-1",
  });

  assert.equal(updatedPayload.isDeleted, true);
  assert.equal(updatedPayload.deletedById, "user-operator-1");
  assert.ok(updatedPayload.deletedAt instanceof Date);
});

test("CustomerQuoteService listQuotes 严格过滤 isDeleted: false 并包含 accessibleWhere", async () => {
  let passedWhere: any = null;
  const mockClient = {
    customerQuote: {
      count: async ({ where }: any) => {
        passedWhere = where;
        return 1;
      },
      findMany: async () => [],
    },
  };

  await CustomerQuoteService.listQuotes(
    mockClient as never,
    { status: "DRAFT" },
    { deptId: "DEPT_001" },
  );

  assert.deepEqual(passedWhere.AND[0], { isDeleted: false });
  assert.deepEqual(passedWhere.AND[1], { deptId: "DEPT_001" });
  assert.deepEqual(passedWhere.AND[2], { status: "DRAFT" });
});
