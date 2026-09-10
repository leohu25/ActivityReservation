import assert from "node:assert/strict";
import test from "node:test";
import {
    deriveCatalogDefinitions,
    deriveNavSections,
    derivePermissionCatalog,
    derivePermissionTree,
    filterNavSections,
    type TenantFeatureManifest,
} from "./manifest";

const mockFeatureA: TenantFeatureManifest = {
    id: "feature-a",
    name: "特性 A",
    order: 10,
    navSections: [
        {
            id: "biz",
            title: "业务中心",
            items: [
                {
                    id: "item-a1",
                    label: "页面 A1",
                    href: "/a1",
                    requiredAction: "read",
                    requiredSubject: "SubjectA1",
                },
                {
                    id: "group-a",
                    label: "分组 A",
                    items: [
                        {
                            id: "item-a2",
                            label: "页面 A2",
                            href: "/a2",
                            requiredAction: "read",
                            requiredSubject: "SubjectA2",
                        },
                    ],
                },
            ],
        },
    ],
    permissions: [
        {
            resource: "res.a1",
            subject: "SubjectA1",
            actions: ["read", "create"],
        },
    ],
    permissionModules: [
        {
            moduleKey: "mod-a",
            label: "模块 A",
            iconName: "User",
            pages: [
                {
                    resource: "res.a1",
                    subject: "SubjectA1",
                    label: "页面 A1",
                    actions: [{ action: "read", label: "查看" }],
                },
            ],
        },
    ],
};

const mockFeatureB: TenantFeatureManifest = {
    id: "feature-b",
    name: "特性 B",
    order: 20,
    navSections: [
        {
            id: "biz",
            title: "业务中心",
            items: [
                {
                    id: "item-b1",
                    label: "页面 B1",
                    href: "/b1",
                    requiredAction: "read",
                    requiredSubject: "SubjectB1",
                },
            ],
        },
    ],
    permissions: [
        {
            resource: "res.b1",
            subject: "SubjectB1",
            actions: ["read"],
        },
    ],
};

test("deriveCatalogDefinitions 能够正确聚合与去重 permissions", () => {
    const defs = deriveCatalogDefinitions([mockFeatureA, mockFeatureB]);
    assert.equal(defs.length, 2);
    assert.equal(defs[0].resource, "res.a1");
    assert.equal(defs[1].resource, "res.b1");
});

test("derivePermissionCatalog 生成强类型 PermissionCatalog 实例", () => {
    const catalog = derivePermissionCatalog([mockFeatureA, mockFeatureB]);
    assert.ok(catalog);
    assert.equal(catalog.definitions.length, 2);
    assert.equal(catalog.resolve("res.a1")?.subject, "SubjectA1");
});

test("deriveNavSections 能够自动合并同 sectionId 的菜单与分组", () => {
    const sections = deriveNavSections([mockFeatureA, mockFeatureB]);
    assert.equal(sections.length, 1);
    assert.equal(sections[0].id, "biz");
    assert.equal(sections[0].items.length, 3); // item-a1, group-a, item-b1
});

test("derivePermissionTree 能够提取所有模块描述", () => {
    const tree = derivePermissionTree([mockFeatureA, mockFeatureB]);
    assert.equal(tree.length, 1);
    assert.equal(tree[0].moduleKey, "mod-a");
});

test("filterNavSections 依据 can 判定过滤叶子节点与空分组", () => {
    const sections = deriveNavSections([mockFeatureA, mockFeatureB]);

    // 场景 1: 仅拥有 SubjectA1 权限
    const filtered1 = filterNavSections(
        sections,
        (action, subject) => action === "read" && subject === "SubjectA1",
    );
    assert.equal(filtered1.length, 1);
    assert.equal(filtered1[0].items.length, 1);
    assert.equal((filtered1[0].items[0] as { id: string }).id, "item-a1");

    // 场景 2: 拥有 SubjectA2 权限（所属折叠分组被保留）
    const filtered2 = filterNavSections(
        sections,
        (action, subject) => action === "read" && subject === "SubjectA2",
    );
    assert.equal(filtered2.length, 1);
    assert.equal(filtered2[0].items.length, 1);
    assert.equal((filtered2[0].items[0] as { id: string }).id, "group-a");

    // 场景 3: 没有任何权限时，整个 section 被完全移除
    const filtered3 = filterNavSections(sections, () => false);
    assert.equal(filtered3.length, 0);
});
