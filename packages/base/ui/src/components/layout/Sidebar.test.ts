import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { Sidebar, type NavSection } from "./Sidebar";
import { SidebarProvider } from "../ui/sidebar";

function renderSidebar(element: React.ReactElement) {
	return renderToString(React.createElement(SidebarProvider, null, element));
}

const mockSections: readonly NavSection[] = [
	{
		id: "base",
		items: [
			{
				id: "workbench",
				label: "工作台",
				href: "/workbench",
			},
		],
	},
	{
		id: "biz",
		title: "业务中心",
		items: [
			{
				id: "customer-center",
				label: "采购订单中心",
				href: "/customer/customers",
				requiredAction: "read",
				requiredSubject: "Customer",
			},
		],
	},
	{
		id: "system",
		title: "系统管理",
		items: [
			{
				id: "group-organization",
				label: "组织架构",
				items: [
					{
						id: "org-employees",
						label: "员工管理",
						href: "/organization/employees",
						requiredAction: "read",
						requiredSubject: "Employee",
					},
				],
			},
			{
				id: "group-permissions",
				label: "权限管理",
				items: [
					{
						id: "settings-roles",
						label: "角色权限管理",
						href: "/settings/roles",
						requiredAction: "read",
						requiredSubject: "RoleManagement",
					},
				],
			},
			{
				id: "group-settings",
				label: "企业设置",
				items: [
					{
						id: "settings-company",
						label: "企业信息",
						href: "/settings/company",
					},
					{
						id: "settings-general",
						label: "基础设置",
						href: "/settings/general",
					},
					{
						id: "settings-security",
						label: "安全设置",
						href: "/settings/security",
					},
				],
			},
			{
				id: "group-audit",
				label: "审计日志",
				items: [
					{
						id: "audit-operations",
						label: "操作日志",
						href: "/audit/operations",
					},
				],
			},
		],
	},
];

test("Sidebar 正确渲染传入的导航区块与各多级菜单分组", () => {
	const html = renderSidebar(
		React.createElement(Sidebar, {
			sections: mockSections,
			currentPath: "/workbench",
		}),
	);

	// 验证基础顶级菜单
	assert.ok(html.includes("工作台"));
	assert.ok(html.includes('href="/workbench"'));

	// 验证业务中心区块
	assert.ok(html.includes("业务中心"));
	assert.ok(html.includes("采购订单中心"));
	assert.ok(html.includes('href="/customer/customers"'));

	// 验证系统管理区块与其多级折叠分组
	assert.ok(html.includes("系统管理"));
	assert.ok(html.includes("组织架构"));
	assert.ok(html.includes("权限管理"));
	assert.ok(html.includes("企业设置"));
	assert.ok(html.includes("审计日志"));
});

test("Sidebar 依据当前路由自动展开所属父级分组并高亮对应子项", () => {
	const html = renderSidebar(
		React.createElement(Sidebar, {
			sections: mockSections,
			currentPath: "/settings/company",
		}),
	);

	assert.ok(html.includes("企业信息"));
	assert.ok(html.includes('href="/settings/company"'));
	assert.ok(html.includes("基础设置"));
	assert.ok(html.includes("安全设置"));

	// 官方 Base UI SidebarMenuSubButton 激活态通过 presence attribute "data-active" 表达
	assert.ok(html.includes("data-active"));
});

test("Sidebar 支持通过 can 回调执行功能权限过滤", () => {
	// 拒绝 Customer.read 权限
	const canMock = (action: string, subject: string) => {
		if (subject === "Customer" && action === "read") {
			return false;
		}
		return true;
	};

	const html = renderSidebar(
		React.createElement(Sidebar, {
			sections: mockSections,
			currentPath: "/workbench",
			can: canMock,
		}),
	);

	// 采购订单中心被过滤
	assert.ok(!html.includes("采购订单中心"));
	assert.ok(!html.includes('href="/customer/customers"'));

	// 工作台与其他公开/有权限项正常保留
	assert.ok(html.includes("工作台"));
	assert.ok(html.includes("组织架构"));
});

test("Sidebar 支持扁平 navItems 传参模式", () => {
	const customItems = [
		{ id: "custom-1", label: "自定义单页", href: "/custom/page" },
	];

	const html = renderSidebar(
		React.createElement(Sidebar, {
			navItems: customItems,
			currentPath: "/custom/page",
		}),
	);

	assert.ok(html.includes("自定义单页"));
	assert.ok(html.includes('href="/custom/page"'));
});

test("Sidebar 正确渲染多级子菜单中的图标", () => {
	const customSections = [
		{
			id: "sec-group",
			items: [
				{
					id: "group-supply",
					label: "物料中心",
					icon: "Layers",
					items: [
						{
							id: "sub-bom",
							label: "工艺BOM",
							href: "/material/boms",
							icon: "FileSpreadsheet",
						},
					],
				},
			],
		},
	];

	const html = renderSidebar(
		React.createElement(Sidebar, {
			sections: customSections,
			currentPath: "/material/boms",
		}),
	);

	assert.ok(html.includes("工艺BOM"));
	assert.ok(html.includes('href="/material/boms"'));
	// 验证子菜单渲染了对应的图标组件
	assert.ok(/lucide-file-spreadsheet|file-spreadsheet/i.test(html));
});
