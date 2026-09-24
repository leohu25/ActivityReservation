import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { z } from "zod";
import { FormPage, UiAbilityProvider, type FormFieldSchema } from "../../index";

const sampleSchema = z.object({
	code: z.string().min(1, "编码必填"),
	name: z.string().min(1, "名称必填"),
	remark: z.string().optional(),
});

const sampleFields: FormFieldSchema[] = [
	{
		name: "code",
		label: "单据编码",
		type: "text",
		required: true,
		placeholder: "请输入编码",
	},
	{
		name: "name",
		label: "单据名称",
		type: "text",
		required: true,
		placeholder: "请输入名称",
	},
];

test("FormPage [create 模式]: 渲染全屏页面单据头、分栏区块与操作按钮", () => {
	const html = renderToString(
		<FormPage
			mode="create"
			title="新建销售出库单"
			badge="OUT-BOUND"
			documentNumber="DOC-20250921-001"
			schema={sampleSchema}
			sections={[
				{
					title: "基础信息",
					description: "单据核心主体与关联客商",
					fields: sampleFields,
				},
			]}
			initialValues={{
				code: "OUT-001",
				name: "测试单据",
				remark: "",
			}}
			onSubmit={async () => {}}
		/>,
	);

	// 1. 验证顶部单据标题与徽章
	assert.ok(html.includes("新建销售出库单"));
	assert.ok(html.includes("OUT-BOUND"));
	assert.ok(html.includes("DOC-20250921-001"));

	// 2. 验证分栏区块与字段
	assert.ok(html.includes("基础信息"));
	assert.ok(html.includes("单据核心主体与关联客商"));
	assert.ok(html.includes("单据编码"));
	assert.ok(html.includes("单据名称"));

	// 3. 验证保存按钮与重置按钮
	assert.ok(html.includes("立即保存"));
	assert.ok(html.includes("重置"));
	assert.ok(html.includes("返回列表"));
});

test("FormPage [view 模式]: 自动进入只读态，不渲染保存与重置按钮", () => {
	const html = renderToString(
		<FormPage
			mode="view"
			title="查看销售出库单"
			badge="OUT-BOUND"
			schema={sampleSchema}
			fields={sampleFields}
			initialValues={{
				code: "OUT-001",
				name: "测试单据",
			}}
		/>,
	);

	assert.ok(html.includes("查看销售出库单"));
	assert.ok(!html.includes("立即保存"));
	assert.ok(!html.includes("保存更改"));
	assert.ok(!html.includes("重置"));
	// 验证字段带 disabled 属性
	assert.ok(html.includes("disabled"));
});

test("FormPage [CASL 权限闭环]: 严格受控于 UiAbility", () => {
	const mockAbility = {
		can: (action: string, _subject: string, field?: string) => {
			// 模拟 code 字段不可读 (HIDDEN)
			if (field === "code") return false;
			// 模拟 name 字段可读不可写 (READONLY)
			if (action === "create" && field === "name") return false;
			return true;
		},
	};

	const html = renderToString(
		<FormPage
			mode="create"
			title="权限受控单据"
			subject="Outbound"
			ability={mockAbility}
			schema={sampleSchema}
			fields={sampleFields}
			initialValues={{
				code: "HIDDEN_VALUE",
				name: "READONLY_VALUE",
			}}
		/>,
	);

	// 1. code 字段彻底不渲染
	assert.ok(!html.includes("单据编码"));
	assert.ok(!html.includes("HIDDEN_VALUE"));

	// 2. name 字段只读置灰，带提示
	assert.ok(html.includes("单据名称"));
	assert.ok(html.includes("受字段权限控制，当前角色不可修改"));
});

test("FormPage [必填与隐藏动态协调]: 被 HIDDEN 隐藏的必填字段在渲染与表单结构中彻底剥离", () => {
	const hiddenRequiredAbility = {
		can: (_action: string, subject?: string, field?: string) => {
			if (subject === "Outbound" && field === "code") {
				return false;
			}
			return true;
		},
	};

	const html = renderToString(
		<UiAbilityProvider ability={hiddenRequiredAbility}>
			<FormPage
				mode="create"
				title="新建销售单据"
				subject="Outbound"
				ability={hiddenRequiredAbility}
				schema={sampleSchema}
				fields={sampleFields}
				initialValues={{
					code: "", // 虽为空且必填，但由于被权限隐藏，不应在界面中渲染
					name: "测试商品",
				}}
			/>
		</UiAbilityProvider>,
	);

	assert.ok(html.includes("单据名称"));
	assert.ok(!html.includes("单据编码"));
});

