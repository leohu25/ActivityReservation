import test from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeSearchKeyword,
  generateSearchPlaceholder,
  type SearchContract,
} from "./keyword-search";
import { executeSearchContract } from "./keyword-search-engine";

test("sanitizeSearchKeyword: 过滤前后空格与不可见控制字符，限制长度", () => {
  assert.equal(sanitizeSearchKeyword(undefined), "");
  assert.equal(sanitizeSearchKeyword(null), "");
  assert.equal(sanitizeSearchKeyword("   "), "");
  assert.equal(sanitizeSearchKeyword("  李四  "), "李四");
  // 过滤控制字符 \x00 \x1b 等
  assert.equal(sanitizeSearchKeyword("Hello\x00World\x1b!"), "HelloWorld!");
  // 截断超长字符串
  const longStr = "a".repeat(150);
  assert.equal(sanitizeSearchKeyword(longStr).length, 100);
});

test("generateSearchPlaceholder: 根据契约自动生成语义化占位符", () => {
  const contract: SearchContract = {
    direct: [
      { field: "orderId", label: "订单号" },
      { field: "salesPerson", label: "销售员" },
    ],
    relations: [
      { targetField: "customerCode", label: "客户" },
      { targetField: "storeCode", label: "门店" },
    ],
  };

  const placeholder = generateSearchPlaceholder(contract);
  assert.equal(placeholder, "输入 订单号 / 销售员 / 客户 / 门店...");

  // 空契约回退
  assert.equal(generateSearchPlaceholder(null), "输入关键字搜索...");
});

test("executeSearchContract: 自动并行反查关联外键，并安全合成 OR 条件", async () => {
  const mockClient = {
    customer: {
      findMany: async (args: {
        where: { customerName: { contains: string } };
      }) => {
        if (args.where.customerName.contains === "李四") {
          return [{ customerCode: "CUST-001" }, { customerCode: "CUST-002" }];
        }
        return [];
      },
    },
    customerStore: {
      findMany: async () => [{ storeCode: "STORE-001" }],
    },
  };

  const contract: SearchContract = {
    direct: [
      { field: "orderId", label: "订单号" },
      { field: "salesPerson", label: "销售员" },
    ],
    relations: [
      {
        targetField: "customerCode",
        relationModel: "customer",
        searchField: "customerName",
        label: "客户",
      },
      {
        targetField: "storeCode",
        relationModel: "customerStore",
        searchField: "storeName",
        label: "门店",
      },
    ],
  };

  const orConditions = await executeSearchContract(
    mockClient,
    contract,
    " 李四 ",
  );

  // 验证返回的 OR 条件
  assert.equal(orConditions.length, 4);
  assert.deepEqual(orConditions[0], {
    orderId: { contains: "李四", mode: "insensitive" },
  });
  assert.deepEqual(orConditions[1], {
    salesPerson: { contains: "李四", mode: "insensitive" },
  });
  assert.deepEqual(orConditions[2], {
    customerCode: { in: ["CUST-001", "CUST-002"] },
  });
  assert.deepEqual(orConditions[3], {
    storeCode: { in: ["STORE-001"] },
  });
});

test("executeSearchContract: 支持自定义 query 回调穿透查询", async () => {
  const mockClient = { id: "test" };

  const contract: SearchContract = {
    direct: [{ field: "code", label: "编码" }],
    relations: [
      {
        targetField: "deptId",
        label: "部门",
        query: async (_client, kw) => {
          if (kw === "技术") return ["DEPT-TECH-01"];
          return [];
        },
      },
    ],
  };

  const conditions = await executeSearchContract(mockClient, contract, "技术");
  assert.equal(conditions.length, 2);
  assert.deepEqual(conditions[1], {
    deptId: { in: ["DEPT-TECH-01"] },
  });
});
