import test from "node:test";
import assert from "node:assert/strict";
import {
  CustomerCategoryTagService,
  CustomerService,
  CustomerStoreService,
  CustomerQuoteService,
} from "./services";

test("CustomerCategoryTagService - 多级分类树构建防死循环与层级聚合", async () => {
  const mockCategories = [
    {
      categoryCode: "CAT_FOOD",
      categoryName: "餐饮连锁",
      parentCode: null,
      description: null,
      status: "ACTIVE",
    },
    {
      categoryCode: "CAT_FAST_FOOD",
      categoryName: "快餐简餐",
      parentCode: "CAT_FOOD",
      description: null,
      status: "ACTIVE",
    },
    {
      categoryCode: "CAT_ORG",
      categoryName: "企事业单位",
      parentCode: null,
      description: null,
      status: "ACTIVE",
    },
  ];

  const mockClient: any = {
    customerCategory: {
      findMany: async () => mockCategories,
    },
  };

  const tree = await CustomerCategoryTagService.getCategoryTree(mockClient);
  assert.equal(tree.length, 2, "根分类应有两个");
  const foodCat = tree.find((t: any) => t.categoryCode === "CAT_FOOD");
  assert.ok(foodCat, "应该存在餐饮连锁");
  assert.equal(foodCat.children.length, 1, "餐饮连锁下应有一个子分类");
  assert.equal(foodCat.children[0]?.categoryCode, "CAT_FAST_FOOD");
});

test("CustomerService - 自动递增编码生成规则", async () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const prefix = `CUST-${yyyy}${mm}${dd}-`;

  const mockClientWithExisting: any = {
    customer: {
      findFirst: async () => ({ customerCode: `${prefix}0008` }),
    },
  };

  const nextCode = await CustomerService.generateCustomerCode(
    mockClientWithExisting,
  );
  assert.equal(
    nextCode,
    `${prefix}0009`,
    "流水号应在已有最大的基础上+1并四位补零",
  );

  const mockClientEmpty: any = {
    customer: {
      findFirst: async () => null,
    },
  };

  const firstCode = await CustomerService.generateCustomerCode(mockClientEmpty);
  assert.equal(firstCode, `${prefix}0001`, "当日无记录时应从0001开始");
});

test("CustomerService - 铁律：停用客户时强制级联停用所有下属门店", async () => {
  let customerUpdatedStatus = "";
  let storesUpdatedStatus = "";
  let storeWhereCondition: any = null;

  const mockClient: any = {
    $transaction: async (fn: any) => {
      return fn({
        customer: {
          update: async (args: any) => {
            customerUpdatedStatus = args.data.status;
            return {
              customerCode: args.where.customerCode,
              status: args.data.status,
            };
          },
        },
        customerStore: {
          updateMany: async (args: any) => {
            storeWhereCondition = args.where;
            storesUpdatedStatus = args.data.status;
            return { count: 3 };
          },
        },
      });
    },
  };

  await CustomerService.updateCustomerStatus(
    mockClient,
    "CUST-20260910-0001",
    "DISABLED",
  );

  assert.equal(customerUpdatedStatus, "DISABLED", "客户本身应置为停用");
  assert.equal(storesUpdatedStatus, "DISABLED", "下属门店必须被强制更新为停用");
  assert.equal(
    storeWhereCondition.customerCode,
    "CUST-20260910-0001",
    "应按当前客户编码匹配下属门店",
  );
});

test("CustomerService - 控制点：已有门店或报价单的客户禁止物理删除", async () => {
  const mockClientWithStores: any = {
    customerStore: {
      count: async () => 2,
    },
    customerQuote: {
      count: async () => 0,
    },
  };

  await assert.rejects(
    async () => {
      await CustomerService.deleteCustomer(mockClientWithStores, "CUST-001");
    },
    /禁止删除，请进行“停用”操作/,
    "存在下属门店时必须拒绝物理删除",
  );
});

test("CustomerStoreService - 门店必须绑定区域编码且不能在停用客户下新建", async () => {
  const mockClientDisabledCustomer: any = {
    customer: {
      findUnique: async () => ({
        customerCode: "CUST-001",
        customerName: "已停用客户",
        status: "DISABLED",
      }),
    },
  };

  await assert.rejects(async () => {
    await CustomerStoreService.createStore(mockClientDisabledCustomer, {
      customerCode: "CUST-001",
      storeName: "一号店",
      address: "测试路1号",
      contactPerson: "张三",
      contactPhone: "13800000000",
      regionCode: "REGION_01",
    });
  }, /已停用，无法为其新建门店/);

  const mockClientActiveCustomer: any = {
    customer: {
      findUnique: async () => ({
        customerCode: "CUST-001",
        customerName: "正常客户",
        status: "ACTIVE",
      }),
    },
  };

  await assert.rejects(async () => {
    await CustomerStoreService.createStore(mockClientActiveCustomer, {
      customerCode: "CUST-001",
      storeName: "一号店",
      address: "测试路1号",
      contactPerson: "张三",
      contactPhone: "13800000000",
      regionCode: "   ", // 空区域编码
    });
  }, /所属区域编码 \(regionCode\) 为必填项/);
});

test("CustomerQuoteService - 三级报价优先级匹配 (门店报价 > 客户报价 > 区域报价)", async () => {
  // 模拟全维度均有配置时
  const mockClientStoreMatch: any = {
    customerQuoteItem: {
      findFirst: async (args: any) => {
        if (args.where.quote.storeCode === "STOR-001") {
          return { itemCode: "ITEM-1", unitPriceInclTax: 5.0 };
        }
        if (args.where.quote.customerCode === "CUST-001") {
          return { itemCode: "ITEM-1", unitPriceInclTax: 6.0 };
        }
        return { itemCode: "ITEM-1", unitPriceInclTax: 7.0 };
      },
    },
  };

  const matched1 = await CustomerQuoteService.resolvePrice(
    mockClientStoreMatch,
    {
      itemCode: "ITEM-1",
      customerCode: "CUST-001",
      storeCode: "STOR-001",
      regionCode: "REGION-01",
    },
  );
  assert.equal(matched1?.priority, "STORE", "同时存在时必须优先命中门店报价");
  assert.equal(matched1?.item.unitPriceInclTax, 5.0);

  // 模拟门店无专属报价，但客户有通用报价
  const mockClientCustomerMatch: any = {
    customerQuoteItem: {
      findFirst: async (args: any) => {
        if (args.where.quote.storeCode === "STOR-001") {
          return null; // 门店无
        }
        if (args.where.quote.customerCode === "CUST-001") {
          return { itemCode: "ITEM-1", unitPriceInclTax: 6.0 };
        }
        return { itemCode: "ITEM-1", unitPriceInclTax: 7.0 };
      },
    },
  };

  const matched2 = await CustomerQuoteService.resolvePrice(
    mockClientCustomerMatch,
    {
      itemCode: "ITEM-1",
      customerCode: "CUST-001",
      storeCode: "STOR-001",
      regionCode: "REGION-01",
    },
  );
  assert.equal(matched2?.priority, "CUSTOMER", "门店无报价时次选客户通用报价");
  assert.equal(matched2?.item.unitPriceInclTax, 6.0);

  // 模拟门店与客户均无，回退保底区域报价
  const mockClientRegionMatch: any = {
    customerQuoteItem: {
      findFirst: async (args: any) => {
        if (args.where.quote.storeCode === "STOR-001") return null;
        if (args.where.quote.customerCode === "CUST-001") return null;
        if (args.where.quote.regionCode === "REGION-01") {
          return { itemCode: "ITEM-1", unitPriceInclTax: 7.0 };
        }
        return null;
      },
    },
  };

  const matched3 = await CustomerQuoteService.resolvePrice(
    mockClientRegionMatch,
    {
      itemCode: "ITEM-1",
      customerCode: "CUST-001",
      storeCode: "STOR-001",
      regionCode: "REGION-01",
    },
  );
  assert.equal(
    matched3?.priority,
    "REGION",
    "门店和客户都无时匹配区域保底报价",
  );
  assert.equal(matched3?.item.unitPriceInclTax, 7.0);
});
