import assert from "node:assert/strict";
import test from "node:test";
import { generateUuidV7, isUuidV7 } from "./uuid";

test("generateUuidV7 - 生成标准 36 字符合规 UUIDv7", () => {
  const id1 = generateUuidV7();
  const id2 = generateUuidV7();

  assert.equal(typeof id1, "string");
  assert.equal(id1.length, 36);
  assert.ok(isUuidV7(id1));
  assert.ok(isUuidV7(id2));
  assert.notEqual(id1, id2);
});

test("generateUuidV7 - 生成的 ID 具备时序递增特性", async () => {
  const first = generateUuidV7();
  await new Promise((resolve) => setTimeout(resolve, 5));
  const second = generateUuidV7();

  assert.ok(first < second, `期望 ${first} < ${second}`);
});
