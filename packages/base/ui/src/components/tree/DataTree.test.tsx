import test from "node:test";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import {
	UiAbilityProvider,
	type UiAbilityLike,
} from "../auth/ui-ability-context";
import { DataTree } from "./DataTree";

interface MockCategoryNode {
	id: string;
	code: string;
	name: string;
	children?: MockCategoryNode[];
	[key: string]: unknown;
}

const mockTreeData: MockCategoryNode[] = [
	{
		id: "CAT_001",
		code: "CAT_001",
		name: "生鲜肉禽",
		children: [
			{
				id: "CAT_001_01",
				code: "CAT_001_01",
				name: "精品猪肉",
			},
		],
	},
];

function createMockAbility(actions: readonly string[]): UiAbilityLike {
	return {
		can: (action: string, subject: any) => {
			if (subject === "CustomerCategory") {
				return actions.includes(action);
			}
			return false;
		},
	};
}

test("DataTree: 只读权限下无权操作（新建、编辑、删除、上下移）物理隐藏", () => {
	const ability = createMockAbility(["read"]);
	const html = renderToString(
		<UiAbilityProvider ability={ability}>
			<DataTree<MockCategoryNode>
				subject="CustomerCategory"
				title="分类管理"
				data={mockTreeData}
				onCreateRoot={() => {}}
				createRootText="新增一级分类"
				enableOrdering={true}
				onMoveUp={() => {}}
				onMoveDown={() => {}}
				nodeActions={[
					{ action: "create", label: "加子级", onClick: () => {} },
					{ action: "update", label: "编辑节点", onClick: () => {} },
					{ action: "delete", label: "删除节点", onClick: () => {} },
				]}
			/>
		</UiAbilityProvider>,
	);

	assert.doesNotMatch(html, /新增一级分类/, "无 create 权限不应显示新增根节点");
	assert.doesNotMatch(html, /加子级/, "无 create 权限不应显示加子级");
	assert.doesNotMatch(html, /编辑节点/, "无 update 权限不应显示编辑");
	assert.doesNotMatch(html, /删除节点/, "无 delete 权限不应显示删除");
	assert.doesNotMatch(
		html,
		/title="同级上移"/,
		"无 update 权限不应显示同级上移",
	);
	assert.match(html, /生鲜肉禽/, "基础数据名称仍应正常展示");
});

test("DataTree: 具有对应权限时精准渲染对应操作按钮与同级排序", () => {
	const ability = createMockAbility(["read", "create", "update", "delete"]);
	const html = renderToString(
		<UiAbilityProvider ability={ability}>
			<DataTree<MockCategoryNode>
				subject="CustomerCategory"
				title="分类管理"
				data={mockTreeData}
				onCreateRoot={() => {}}
				createRootText="新增一级分类"
				enableOrdering={true}
				onMoveUp={() => {}}
				onMoveDown={() => {}}
				nodeActions={[
					{ action: "create", label: "加子级", onClick: () => {} },
					{ action: "update", label: "编辑节点", onClick: () => {} },
					{ action: "delete", label: "删除节点", onClick: () => {} },
				]}
			/>
		</UiAbilityProvider>,
	);

	assert.match(html, /新增一级分类/, "有 create 权限应显示新增一级分类");
	assert.match(html, /加子级/, "有 create 权限应显示加子级");
	assert.match(html, /编辑节点/, "有 update 权限应显示编辑");
	assert.match(html, /删除节点/, "有 delete 权限应显示删除");
	assert.match(
		html,
		/title="同级上移"/,
		"有 update 权限且启用 ordering 时应显示同级上移",
	);
});
