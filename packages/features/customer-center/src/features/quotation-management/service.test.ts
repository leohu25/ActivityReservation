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
          findUnique: async () => ({ status: "ACTIVE" }),
        },
      } as never,
      "QUOTE-1",
      "ACTIVE",
    ),
    /仅“草稿”状态/,
  );
});
