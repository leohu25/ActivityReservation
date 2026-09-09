import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import {
    BusinessTableWorkspace,
    WorkspaceAction,
    type ColumnDef,
} from "./BusinessTableWorkspace";

interface MockItem {
    id: string;
    code: string;
    name: string;
    secret: string;
}

const mockData: MockItem[] = [
    { id: "1", code: "PO-001", name: "物料A", secret: "机密价格" },
];

const mockColumns: ColumnDef<MockItem>[] = [
    { id: "code", header: "编码", cell: (r: MockItem) => r.code },
    { id: "name", header: "名称", cell: (r: MockItem) => r.name },
    {
        id: "secret",
        header: "机密列",
        field: "secret",
        cell: (r: MockItem) => r.secret,
    },
];

test("BusinessTableWorkspace: 当具备完整权限时，渲染新增按钮与导出菜单", () => {
    const ability = {
        can(_action: string, _subject: string, _field?: string): boolean {
            return true;
        },
    };

    const html = renderToString(
        <BusinessTableWorkspace<MockItem>
            subject="TestSubject"
            ability={ability}
            title="测试工作台"
            data={mockData}
            columns={mockColumns}
            rowKey={(r: MockItem) => r.id}
            createButton={{
                label: "新增单据",
                onClick: () => {},
            }}
            moreActions={{
                onExport: () => {},
            }}
        />,
    );

    assert.match(html, /新增单据/);
    assert.match(html, /更多/);
    assert.match(html, /机密列/);
    assert.match(html, /PO-001/);
});

test("BusinessTableWorkspace: 当无 create 权限时，自动隐藏新增按钮", () => {
    const ability = {
        can(action: string, _subject: string, _field?: string): boolean {
            if (action === WorkspaceAction.CREATE) return false;
            return true;
        },
    };

    const html = renderToString(
        <BusinessTableWorkspace<MockItem>
            subject="TestSubject"
            ability={ability}
            title="测试工作台"
            data={mockData}
            columns={mockColumns}
            rowKey={(r: MockItem) => r.id}
            createButton={{
                label: "新增单据",
                onClick: () => {},
            }}
        />,
    );

    assert.doesNotMatch(html, /新增单据/);
});

test("BusinessTableWorkspace: 当无字段 read 权限时，自动隐藏受控列", () => {
    const ability = {
        can(action: string, _subject: string, field?: string): boolean {
            if (action === WorkspaceAction.READ && field === "secret")
                return false;
            return true;
        },
    };

    const html = renderToString(
        <BusinessTableWorkspace<MockItem>
            subject="TestSubject"
            ability={ability}
            title="测试工作台"
            data={mockData}
            columns={mockColumns}
            rowKey={(r: MockItem) => r.id}
        />,
    );

    assert.match(html, /编码/);
    assert.match(html, /名称/);
    assert.doesNotMatch(html, /机密列/);
    assert.doesNotMatch(html, /机密价格/);
});
