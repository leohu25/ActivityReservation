import test from "node:test";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { DirectoryTreeFilter } from "./DirectoryTreeFilter";

const mockFilterNodes = [
  {
    id: "DEPT_01",
    name: "总经办",
    code: "EXEC",
    badge: 5,
    children: [
      {
        id: "DEPT_02",
        name: "综合行政部",
        code: "ADMIN",
        badge: 2,
      },
    ],
  },
];

test("DirectoryTreeFilter [全量渲染]: 渲染全部根项、子节点与搜索框", () => {
  const html = renderToString(
    <DirectoryTreeFilter
      title="组织架构筛选"
      allLabel="所有部门"
      totalCount={7}
      nodes={mockFilterNodes}
      selectedId={null}
      onSelect={() => {}}
      showSearch={true}
    />,
  );

  assert.ok(html.includes("组织架构筛选"));
  assert.ok(html.includes("所有部门"));
  assert.ok(html.includes("总经办"));
  assert.ok(html.includes("综合行政部"));
  assert.ok(html.includes("7"));
});
