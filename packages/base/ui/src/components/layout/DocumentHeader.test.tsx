import assert from "node:assert/strict";
import test from "node:test";
import { renderToString } from "react-dom/server";
import { DocumentHeader } from "./DocumentHeader";

test("DocumentHeader 正确渲染返回按钮、主标题与右侧操作插槽", () => {
	const html = renderToString(
		<DocumentHeader
			onBack={() => {}}
			backText="返回列表"
			title="新建生产BOM方案"
			badges={<span id="badge-default">默认BOM</span>}
			slotActions={<button type="button">立即发布</button>}
		/>,
	);

	assert.ok(html.includes("返回列表"), "应正确渲染返回按钮文本");
	assert.ok(html.includes("新建生产BOM方案"), "应正确渲染单据主标题");
	assert.ok(html.includes("badge-default"), "应正确挂载 badges 徽章插槽");
	assert.ok(html.includes("立即发布"), "应正确挂载 slotActions 操作区插槽");
	assert.ok(html.includes("h-12"), "应满足 h-12 (48px) 标准单据顶栏规范");
});

test("DocumentHeader 正确挂载 slotMiddle 中间动态类型插槽", () => {
	const html = renderToString(
		<DocumentHeader
			title="编辑生产BOM"
			slotMiddle={
				<div id="type-selector">
					<button type="button">单品BOM</button>
					<button type="button">组合BOM</button>
				</div>
			}
		/>,
	);

	assert.ok(
		html.includes("type-selector"),
		"应正确挂载 slotMiddle 中间类型动态插槽",
	);
	assert.ok(html.includes("单品BOM"), "应包含插槽注入的选项内容");
});
