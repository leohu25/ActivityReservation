import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { EditableDetailTable } from "./EditableDetailTable";

test("EditableDetailTable [只读模式]: 渲染表头、单元格与空状态提示，隐藏增删行按钮", () => {
    const html = renderToString(
        <EditableDetailTable<{ id: string; name: string }>
            columns={[
                { id: "id", header: "编码", renderCell: (row) => row.id },
                { id: "name", header: "名称", renderCell: (row) => row.name },
            ]}
            data={[{ id: "001", name: "西红柿" }]}
            readOnly={true}
        />,
    );

    assert.ok(html.includes("编码"));
    assert.ok(html.includes("名称"));
    assert.ok(html.includes("001"));
    assert.ok(html.includes("西红柿"));
    assert.ok(!html.includes("添加明细"));
    assert.ok(!html.includes("操作"));
});

test("EditableDetailTable [可编辑模式]: 渲染添加行按钮与操作列", () => {
    const html = renderToString(
        <EditableDetailTable<{ id: string; name: string }>
            columns={[
                { id: "id", header: "编码", renderCell: (row) => row.id },
                { id: "name", header: "名称", renderCell: (row) => row.name },
            ]}
            data={[{ id: "001", name: "黄瓜" }]}
            readOnly={false}
            onChange={() => {}}
            onAddRow={() => ({ id: "002", name: "青菜" })}
        />,
    );

    assert.ok(html.includes("添加明细"));
    assert.ok(html.includes("操作"));
});
