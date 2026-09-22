import test from "node:test";
import assert from "node:assert/strict";
import { createPrismaAbility, type PrismaAbility } from "@casl/prisma";
import { FAIL_CLOSED_ID } from "@base/shared";
import { getAccessibleWhere } from "./prisma-access";

interface TestRawRule {
  readonly action: string;
  readonly subject: string;
  readonly conditions?: Record<string, unknown>;
}

function createTestPrismaAbility(
  rules: readonly TestRawRule[],
): PrismaAbility<[string, string]> {
  // SAFETY: 单元测试使用通用 RawRule 映射构造用于验证下推逻辑的 PrismaAbility 实例
  const raw = rules as unknown as Parameters<typeof createPrismaAbility>[0];
  const ability = createPrismaAbility(raw);
  // SAFETY: 将创建的能力实例安全收敛为带泛型参数的 PrismaAbility<[string, string]>
  return ability as unknown as PrismaAbility<[string, string]>;
}

test("getAccessibleWhere 能正确从规则条件中提取 Prisma where 查询对象", () => {
  const ability = createTestPrismaAbility([
    {
      action: "read",
      subject: "PurchaseOrder",
      conditions: {
        deptId: { in: ["dept_1", "dept_2"] },
      },
    },
  ]);

  const where = getAccessibleWhere(ability, "PurchaseOrder", "read");
  assert.deepEqual(where, {
    OR: [
      {
        deptId: { in: ["dept_1", "dept_2"] },
      },
    ],
  });
});

test("getAccessibleWhere 遇到全量无条件权限时返回空对象（即不增加过滤约束）", () => {
  const ability = createTestPrismaAbility([
    {
      action: "read",
      subject: "PurchaseOrder",
    },
  ]);

  const where = getAccessibleWhere(ability, "PurchaseOrder", "read");
  assert.deepEqual(where, {});
});

test("getAccessibleWhere 在未授权或动作被拒绝时严格执行 Fail-Closed 返回拒绝条件", () => {
  const ability = createTestPrismaAbility([
    {
      action: "create",
      subject: "PurchaseOrder",
    },
  ]);

  const where = getAccessibleWhere(ability, "PurchaseOrder", "read");
  assert.deepEqual(where, {
    AND: [{ id: FAIL_CLOSED_ID }],
  });
});
