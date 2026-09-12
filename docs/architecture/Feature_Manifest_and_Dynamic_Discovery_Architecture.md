# 架构资产：业务切片自描述契约 (Feature Manifest) 与构建期自动发现体系

> **版本**：v1.0.0  
> **适用范围**：Next.js 16 (Turbopack) + React 19 + TypeScript Modular Monorepo + Feature-based Vertical Slice Architecture
> **核心目标**：实现业务切片 100% 自包含（菜单、路由、CASL 权限、敏感字段自描述），根治“改一处动四处”的土豆代码，彻底净化 UI 库与 Thin App 边界，达成零运行时 I/O 开销的编译期特性自动发现。

---

## 一、 背景与痛点分析

在传统的前端后台与多租户 SaaS 架构演化过程中，随着业务模块（如客户、采购、仓储、财务等）不断增加，系统极易陷入**“横向割裂”**与**“配置地狱”**：

### 1. “改一处动四处”的土豆代码困境

此前新增一个业务模块或增删一个菜单，开发者必须跨越 4 个不同包的手动修改：

1. 在 `packages/features/xxx` 编写业务组件与服务；
2. 在 `apps/tenant/src/lib/global-catalog.ts` 手动登记 `PermissionDefinition`；
3. 在 `packages/ui/src/components/layout/Sidebar.tsx` 手动追加 `DEFAULT_NAV_SECTIONS`；
4. 在 `packages/features/tenant-admin/src/permission-registry.ts` 手动拼接 `TENANT_PERMISSION_TREE` 树形结构。

**后果**：开发者心智负担沉重，极易因拼写不一致（如 `subject` 与 `resource` 错配）引发隐蔽的权限缺陷。

### 2. 基础 UI 库与应用边界破损

- **UI 库不纯**：`packages/ui` 里的 `Sidebar.tsx` 硬编码了大量具体的 ERP 业务菜单（客户中心、采购订单等），破坏了原子与积木 UI 库的无业务纯净性。
- **App 边界膨胀**：`apps/tenant/src/lib` 平铺堆放重度 CASL 编译与鉴权组装逻辑，严重违反了“应用层极薄化 (Thin Apps)”的最高工程宪法。

### 3. Turbopack 与 RSC 运行时的“动态扫描陷阱”

很多团队曾尝试用 Node.js 运行时 `fs.readdir` 动态扫描文件夹并 `await import(dynamicPath)`：

- **致命缺陷**：Next.js 16 / Turbopack 会因为动态变量路径无法进行静态依赖图分析，直接导致构建失败、Tree-Shaking 失效，服务端冷启动开销放大数十倍（行业基准 140ms vs 6ms）。

---

## 二、 现代工业级架构解法：三层闭环模型

本项目对齐 Spotify Backstage、NextSpark、Medusa v2 等现代前沿开源架构，确立了**「贡献点契约（Contribution Points）+ 构建期自动发现（Build-time Registry）+ 服务端权限驱动导航（Server Navigation Engine）」**的三层闭环体系：

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 层级 1：切片自包含贡献点 (Feature Manifest)                              │
│ - 每个 packages/features/<name> 导出独立的 manifest.ts                  │
│ - 自描述本特性的导航路由、图标、CASL 权限、敏感字段策略                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (pnpm dev / build 构建期钩子)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 层级 2：构建期自动发现引擎 (Build-Time Auto-Discovery)                   │
│ - scripts/sync-features.mjs (极速 10ms 扫描切片 manifest.ts)           │
│ - 自动生成 packages/features/tenant-admin/src/registry.generated.ts    │
│ - 纯静态 TypeScript 导入，零运行时 I/O，100% Tree-Shaking 与类型安全   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (导出聚合派生工具)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 层级 3：服务端权限驱动导航引擎 (Server-Side Navigation Engine)          │
│ - apps/tenant/src/app/(dashboard)/layout.tsx (极薄装配线)              │
│ - 在服务端使用当前用户 CASL Ability 完成菜单全量裁剪 (Fail-Closed)     │
│ - packages/ui/Sidebar 仅作为接收 sections 的无状态纯 UI 积木渲染       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 三、 核心契约与数据模型规范

所有契约定义收敛于核心授权包 `@base/authorization` 的 `manifest.ts` 中：

### 1. 切片自描述清单 (`TenantFeatureManifest`)

```ts
export interface TenantFeatureManifest {
  /** 切片唯一标识，如 'procurement-center', 'customer-center' */
  readonly id: string;
  /** 切片中文显示名称，如 '采购中心' */
  readonly name: string;
  /** 排序权重 (数字越小在菜单与权限树中越靠前) */
  readonly order?: number;
  /** 切片贡献的导航区块与菜单项 */
  readonly navSections?: readonly FeatureNavSection[];
  /** 切片贡献的角色权限管理树与受控资源定义（全局唯一权限事实源） */
  readonly permissionModules?: readonly FeatureModulePermissionDescriptor[];
}
```

### 2. 纯数据导航模型（兼容 RSC 序列化）

```ts
export interface FeatureNavItem {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  /** Lucide 图标名称纯字符串 (如 'PackageCheck')，彻底杜绝跨 RSC 边界传递 JSX 实例 */
  readonly icon?: string;
  readonly badge?: string;
  readonly requiredAction?: string;
  readonly requiredSubject?: string;
}

export interface FeatureNavGroup {
  readonly id: string;
  readonly label: string;
  readonly icon?: string;
  readonly items: readonly FeatureNavItem[];
}

export interface FeatureNavSection {
  readonly id: string;
  readonly title?: string;
  readonly order?: number;
  readonly items: readonly (FeatureNavItem | FeatureNavGroup)[];
}
```

---

## 四、 纯函数派生与过滤引擎

为了确保单源收敛，系统提供了一套无副作用的纯函数工具套件（收敛于 `@base/authorization`）：

| 派生工具函数 | 核心职责 | 消费场景 |
| :--- | :--- | :--- |
| `deriveCatalogDefinitions(manifests)` | 从各切片 `permissionModules` 纯函数展平提取受控实体与规则 | 供全局 `CaslAbilityFactory` 编译底层权限规则 |
| `derivePermissionCatalog(manifests)` | 构建强类型 `PermissionCatalog` 实例 | 服务端与测试环境直接获取 CASL 实体校验目录 |
| `deriveNavSections(manifests)` | 自动合并同 `sectionId` 的菜单并按序重排 | 生成系统完整的全量侧边栏菜单结构 |
| `derivePermissionTree(manifests)` | 汇聚生成树形模块结构清单 | 供【角色权限管理】页面直接渲染 RBAC 权限矩阵 |
| `filterNavSections(sections, can)` | **服务端权限裁剪引擎**：剔除无权项、空分组与空分区 | 服务端生成页面时安全裁剪，实现 Fail-Closed |

---

## 五、 构建期自动发现机制 (`scripts/sync-features.mjs`)

通过轻量脚本实现真正的“零配置自发现”：

### 1. 扫描与生成流程

1. 扫描 `packages/features/*/src/manifest.ts`；
2. 读取各切片 `package.json` 中的包名；
3. 提取导出的 `*Manifest` 对象；
4. 自动写入 `packages/features/tenant-admin/src/registry.generated.ts`（带有防重复写入对比机制）；
5. 若文件无变化则秒级跳过，避免引起文件监听器重复热更新。

### 2. 流水线无缝挂载

在根目录 `package.json` 中配置：

```json
{
  "scripts": {
    "sync:features": "node scripts/sync-features.mjs",
    "build": "pnpm sync:features && turbo run build",
    "dev": "pnpm sync:features && turbo run dev",
    "check": "pnpm sync:features && turbo run check",
    "test": "pnpm sync:features && turbo run test"
  }
}
```

**无论开发者运行构建、调试、单测还是类型检查，特性注册表始终保证自动同步！**

---

## 六、 开发者指南：如何新增一个业务切片？

未来当您需要为 ERP 新增一个功能切片（例如 `packages/features/warehouse-center` 仓储中心）时，**只需在自己的切片内完成声明，无需修改任何全局文件**：

### 步骤 1：在切片内编写 `src/manifest.ts`

```ts
// packages/features/warehouse-center/src/manifest.ts
import {
  STANDARD_DATA_SCOPES,
  type TenantFeatureManifest,
} from "@base/authorization";

export const warehouseManifest: TenantFeatureManifest = {
  id: "warehouse-center",
  name: "仓储中心",
  order: 25,
  navSections: [
    {
      id: "biz", // 自动合并入已有的“业务中心”分区
      title: "业务中心",
      items: [
        {
          id: "warehouse-inventory",
          label: "库存盘点中心",
          href: "/warehouse/inventory",
          icon: "PackageSearch",
          requiredAction: "read",
          requiredSubject: "Inventory",
        },
      ],
    },
  ],
  permissionModules: [
    {
      moduleKey: "warehouse",
      label: "仓储中心",
      iconName: "PackageSearch",
      order: 25,
      pages: [
        {
          resource: "warehouse.inventory",
          subject: "Inventory",
          label: "库存盘点中心",
          path: "/warehouse/inventory",
          actions: [
            { action: "read", label: "查看库存", supportedScopes: STANDARD_DATA_SCOPES },
            { action: "update", label: "库存调整", supportedScopes: STANDARD_DATA_SCOPES },
            { action: "export", label: "导出盘点单" },
          ],
        },
      ],
    },
  ],
};
```

### 步骤 2：切片出口导出

在 `packages/features/warehouse-center/src/index.ts` 中导出：

```ts
export * from "./manifest";
```

### 步骤 3：保存并运行

运行 `pnpm dev`。
系统自动扫描、自动挂载：

- 左侧侧边栏自动出现“库存盘点中心”；
- 当前用户无权访问时，服务端自动隐藏该项；
- 管理员打开【系统管理 / 权限管理】时，勾选树上自动出现“仓储中心”配置行；
- 全局 CASL 权限引擎自动纳管 `Inventory` 实体。

---

## 七、 总结

| 维度 | 重构前 | 重构后 (当前实现) |
| :--- | :--- | :--- |
| **菜单维护** | 跨 4 个包手动同步编写，易拼错遗漏 | **单一切片 `manifest.ts` 自包含，单一事实源 (SSoT)** |
| **UI 库纯净度** | `Sidebar.tsx` 硬编码所有业务菜单 | **纯 UI 积木，仅接收 `sections` 属性渲染** |
| **应用层薄度** | `apps/tenant/src/lib` 充斥重度鉴权装配 | **`apps/tenant/src/lib` 物理删除，layout 仅 70 行** |
| **运行时性能** | 易踩 Turbopack 动态 import 黑盒大坑 | **构建期极速生成静态 TS 注册表，0 运行时 I/O 开销** |
| **权限安全** | 客户端依赖 `allowedPermissions` 进行前端隐藏 | **服务端使用 CASL 引擎在生成 HTML 前预先安全过滤** |
