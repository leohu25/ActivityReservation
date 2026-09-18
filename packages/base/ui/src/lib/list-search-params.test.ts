import test from "node:test";
import assert from "node:assert/strict";
import { defineListSearchParams } from "./list-search-params";

test("defineListSearchParams 默认 page/pageSize/keyword + 字符串默认值扩展", async () => {
  const list = defineListSearchParams({
    category: "",
    status: "",
  });

  const parsed = await list.parse(
    Promise.resolve({
      page: "3",
      pageSize: "50",
      keyword: "x",
      category: "C1",
      status: "ACTIVE",
    }),
  );

  assert.deepEqual(parsed, {
    page: 3,
    pageSize: 50,
    keyword: "x",
    category: "C1",
    status: "ACTIVE",
  });

  const empty = await list.parse(Promise.resolve({}));
  assert.equal(empty.page, 1);
  assert.equal(empty.pageSize, 10);
  assert.equal(empty.keyword, "");
  assert.equal(empty.category, "");
});
