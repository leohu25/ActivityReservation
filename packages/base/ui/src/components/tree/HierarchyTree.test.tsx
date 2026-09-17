import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { HierarchyTree, type HierarchyNodeData } from "./HierarchyTree";

interface TestNode extends HierarchyNodeData {
  id: string;
  name: string;
  code?: string;
  children?: TestNode[];
}

const mockTreeData: TestNode[] = [
  {
    id: "ROOT_1",
    name: "餐饮连锁总部",
    code: "CAT_001",
    children: [
      {
        id: "CHILD_1",
        name: "华东分部",
        code: "CAT_002",
      },
    ],
  },
];

test("HierarchyTree [基础渲染]: 渲染根节点与首行常驻新增按钮", () => {
  const html = renderToString(
    <HierarchyTree<TestNode>
      data={mockTreeData}
      createRootText="新增一级分类"
      onCreateRoot={() => {}}
    />,
  );

  assert.ok(html.includes("新增一级分类"));
  assert.ok(html.includes("CAT_001"));
  assert.ok(html.includes("餐饮连锁总部"));
  assert.ok(html.includes("CAT_002"));
  assert.ok(html.includes("华东分部"));
});

test("HierarchyTree [空数据状态]: 渲染空状态提示与新增按钮", () => {
  const html = renderToString(
    <HierarchyTree<TestNode>
      data={[]}
      createRootText="新增一级分类"
      emptyText="暂无分类数据"
      onCreateRoot={() => {}}
    />,
  );

  assert.ok(html.includes("新增一级分类"));
  assert.ok(html.includes("暂无分类数据"));
});
