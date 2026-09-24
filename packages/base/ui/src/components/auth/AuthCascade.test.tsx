import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { DocumentShell } from "../layout/DocumentShell";
import { AuthGuard } from "./AuthGuard";
import { AuthField } from "./AuthField";
import { UiAbilityProvider } from "./ui-ability-context";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

// 构造一个简单的模拟 Ability
const mockFullAbility = {
	can: () => true,
	cannot: () => false,
};

describe("DocumentShell Readonly Cascade to AuthGuard & AuthField", () => {
	it("AuthGuard hides write actions automatically in view mode without manual !isView", () => {
		const html = renderToStaticMarkup(
			<UiAbilityProvider ability={mockFullAbility}>
				<DocumentShell title="测试只读单据" mode="view" subject="TestSubject">
					<AuthGuard action="update">
						<Button data-testid="edit-btn">编辑修改</Button>
					</AuthGuard>
					<AuthGuard action="delete">
						<Button data-testid="del-btn">删除数据</Button>
					</AuthGuard>
					<AuthGuard action="read">
						<div data-testid="read-content">只读日志内容</div>
					</AuthGuard>
				</DocumentShell>
			</UiAbilityProvider>,
		);

		assert.ok(!html.includes("编辑修改"), "view 模式下 update 操作应被 AuthGuard 自动隐藏");
		assert.ok(!html.includes("删除数据"), "view 模式下 delete 操作应被 AuthGuard 自动隐藏");
		assert.ok(html.includes("只读日志内容"), "view 模式下 read 操作应正常展示");
	});

	it("AuthField forces READONLY mode automatically when DocumentShell is in view mode", () => {
		const html = renderToStaticMarkup(
			<UiAbilityProvider ability={mockFullAbility}>
				<DocumentShell title="测试只读单据" mode="view" subject="TestSubject">
					<AuthField field="price" label="销售单价">
						<Input defaultValue="100" />
					</AuthField>
				</DocumentShell>
			</UiAbilityProvider>,
		);

		assert.ok(html.includes("只读"), "view 模式下 AuthField 控件应自动挂载只读 Badge");
		assert.ok(html.includes("disabled"), "view 模式下输入框应自动注入 disabled 属性");
	});
});
