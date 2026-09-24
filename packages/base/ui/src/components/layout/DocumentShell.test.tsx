import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { DocumentShell, useDocumentContext } from "./DocumentShell";

describe("DocumentShell", () => {
	it("renders title, badges and actions correctly", () => {
		const html = renderToStaticMarkup(
			<DocumentShell
				title="测试单据标题"
				documentNumber="DOC-2025-001"
				mode="edit"
				saveText="保存单据"
				onSave={() => {}}
			>
				<div data-testid="content">内部积木内容</div>
			</DocumentShell>,
		);

		assert.ok(html.includes("测试单据标题"), "应包含主标题");
		assert.ok(html.includes("DOC-2025-001"), "应包含业务单号");
		assert.ok(html.includes("内部积木内容"), "应渲染子积木内容");
		assert.ok(html.includes("保存单据"), "应包含保存按钮");
	});

	it("provides context to child blocks", () => {
		function TestChild() {
			const ctx = useDocumentContext();
			return (
				<div>
					<span data-slot="mode">{ctx.mode}</span>
					<span data-slot="readonly">{String(ctx.isReadonly)}</span>
				</div>
			);
		}

		const html = renderToStaticMarkup(
			<DocumentShell title="只读单据" mode="view">
				<TestChild />
			</DocumentShell>,
		);

		assert.ok(html.includes("view"), "子积木应能获取当前模式");
		assert.ok(html.includes("true"), "view 模式下 isReadonly 应自动为 true");
	});
});
