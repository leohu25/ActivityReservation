import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { DetailTable } from "./DetailTable";

test("DetailTable [mode=view]: 渲染表头、单元格与空状态提示，隐藏增删行按钮与操作列", () => {
  const html = renderToString(
    <DetailTable<{ id: string; name: string }>
      columns={[
        { id: "id", header: "编码", renderCell: (row) => row.id },
        { id: "name", header: "名称", renderCell: (row) => row.name },
      ]}
      data={[{ id: "001", name: "西红柿" }]}
      mode="view"
      title="蔬菜清单"
      description="只读查看明细"
      summary={<div>总计：1 项</div>}
    />,
  );

  assert.ok(html.includes("编码"));
  assert.ok(html.includes("名称"));
  assert.ok(html.includes("001"));
  assert.ok(html.includes("西红柿"));
  assert.ok(html.includes("蔬菜清单"));
  assert.ok(html.includes("只读查看明细"));
  assert.ok(html.includes("总计：1 项"));
  assert.ok(!html.includes("添加明细"));
  assert.ok(!html.includes("操作"));
});

test("DetailTable [readOnly=true]: 只读态正确生效", () => {
  const html = renderToString(
    <DetailTable<{ id: string; name: string }>
      columns={[
        { id: "id", header: "编码", renderCell: (row) => row.id },
        { id: "name", header: "名称", renderCell: (row) => row.name },
      ]}
      data={[{ id: "001", name: "西红柿" }]}
      readOnly={true}
    />,
  );

  assert.ok(!html.includes("添加明细"));
  assert.ok(!html.includes("操作"));
});

test("DetailTable [mode=edit]: 渲染添加行按钮与操作列", () => {
  const html = renderToString(
    <DetailTable<{ id: string; name: string }>
      columns={[
        { id: "id", header: "编码", renderCell: (row) => row.id },
        { id: "name", header: "名称", renderCell: (row) => row.name },
      ]}
      data={[{ id: "001", name: "黄瓜" }]}
      mode="edit"
      onChange={() => {}}
      onAddRow={() => ({ id: "002", name: "青菜" })}
    />,
  );

  assert.ok(html.includes("添加明细"));
  assert.ok(html.includes("操作"));
});

test("DetailTable [空数据状态]: 呈现 emptyText", () => {
  const html = renderToString(
    <DetailTable<{ id: string; name: string }>
      columns={[{ id: "id", header: "编码", renderCell: (row) => row.id }]}
      data={[]}
      emptyText="暂无商品明细"
      mode="view"
    />,
  );

  assert.ok(html.includes("暂无商品明细"));
});
