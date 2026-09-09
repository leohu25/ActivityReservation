import test from "node:test";
import assert from "node:assert/strict";
import { Decimal } from "decimal.js";
import { radash, dayjs, superjson, toPlainData } from "./index";

test("dayjs: 正常格式化与日期计算", () => {
  const d = dayjs("2026-09-09T12:00:00Z");
  assert.equal(d.isValid(), true);
  assert.equal(d.format("YYYY-MM-DD"), "2026-09-09");
});

test("radash: 常用工具函数正常工作 (shake, clone, unique, group)", () => {
  // shake 剔除 undefined 字段
  const dirty = { a: 1, b: undefined, c: "test" };
  const clean = radash.shake(dirty);
  assert.deepEqual(clean, { a: 1, c: "test" });

  // clone 深拷贝
  const original = { user: { name: "Tom", roles: ["admin"] } };
  const cloned = radash.clone(original);
  assert.deepEqual(cloned, original);
  assert.notEqual(cloned, original);

  // unique 数组去重
  const list = [1, 2, 2, 3, 1];
  assert.deepEqual(radash.unique(list), [1, 2, 3]);

  // group 分组
  const items = [
    { role: "admin", name: "A" },
    { role: "user", name: "B" },
    { role: "admin", name: "C" },
  ];
  const grouped = radash.group(items, (i) => i.role);
  assert.equal(grouped.admin?.length, 2);
  assert.equal(grouped.user?.length, 1);
});

test("superjson & toPlainData: 遵循官方配方序列化 Decimal 与 Date", () => {
  // 遵循官方配方，使用真正的 Decimal.js 实例
  const realDecimal = new Decimal("9.50");

  const complexData = {
    amount: realDecimal,
    createdAt: new Date("2026-09-09T00:00:00.000Z"),
    tags: ["VIP", "SaaS"],
  };

  // 1. 官方 superjson.serialize 验证
  const serialized = superjson.serialize(complexData);
  assert.ok(serialized.json);
  assert.ok(serialized.meta);

  // 2. toPlainData 提取为 RSC 合法的纯数据对象
  // SAFETY: 测试中验证 Decimal 序列化为 string 后的纯数据结构
  const plain = toPlainData(complexData) as unknown as {
    amount: string;
    createdAt: string;
    tags: string[];
  };

  assert.equal(typeof plain, "object");
  assert.equal(plain.amount, "9.5");
  assert.equal(typeof plain.createdAt, "string");
  assert.equal(plain.tags.length, 2);
});
