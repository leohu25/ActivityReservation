# 架构决策记录 (ADR 0005)：业务切片自描述契约 (Feature Manifest) 与构建期自动发现体系

## 状态

已采纳 (Accepted) - *注：第 2、3 条中关于生成的注册表与授权服务下沉至 tenant-admin 的条款已由 ADR-006 废止并修订至 apps/tenant/src/kernel*

## 上下文

在引入垂直切片架构后，各业务模块在逻辑上虽已分包，但在菜单与权限注册层面仍然存在严重的“横向割裂”：

1. **改一处动四处**：新增一个业务模块时，开发者需要在切片内编写业务代码，并同时手动去 `apps/tenant/src/lib/global-catalog.ts`、`packages/ui/src/components/layout/Sidebar.tsx` 和 `packages/features/tenant-admin/src/permission-registry.ts` 这 3 个跨包文件中重复登记权限和菜单；
2. **UI 库不纯**：`packages/ui` 作为原子与积木 UI 库，内部硬编码了具体的 ERP 业务菜单数据；
3. **应用层边界破损**：`apps/tenant/src/lib` 平铺堆叠了 CASL 编译、持久化角色解析与字段脱敏等重度业务服务，违背了“应用层极薄化 (Thin Apps)”的最高工程宪法；
4. **动态加载风险**：Next.js 16 (Turbopack) 体系下，Node 运行时 `fs.readdir` 动态变量 `import()` 会破坏静态依赖图分析，导致 Tree-Shaking 失效与冷启动性能恶化。

## 决策

1. **确立统一切片自描述契约 (`TenantFeatureManifest`)**：
   - 在 `@base/authorization` 中定义 `TenantFeatureManifest` 标准接口。
   - 每个业务切片包独立管理并在 `src/manifest.ts` 中自描述：
     - **导航贡献**：菜单区块、路由路径、名称与纯文本图标标识；
     - **权限贡献**：CASL 实体、Resource 标识与 Actions 集合；
     - **字段策略**：受控敏感字段清单与只读/隐藏三态策略。

2. **落地构建期代码生成自发现机制 (`scripts/sync-features.mjs`)**：
   - 在 `pnpm dev`、`pnpm build`、`pnpm check` 与 `pnpm test` 流水线前置执行轻量扫描脚本（耗时约 10ms）；
   - 自动扫描 `packages/features/*/src/manifest.ts`，生成只读的 `packages/features/tenant-admin/src/registry.generated.ts`；
   - 保证 Turbopack 打包看到的是纯静态 TypeScript 引用，零运行时 I/O 开销，具备 100% 编译期类型检查与 IntelliSense 智能补全。

3. **纯函数单源派生与服务端权限导航过滤**：
   - 提供 `deriveCatalogDefinitions`、`derivePermissionCatalog`、`deriveNavSections` 与 `derivePermissionTree` 纯函数；
   - 提供 `filterNavSections` 服务端过滤引擎，在 SSR 渲染前根据当前用户 CASL Ability 完成菜单裁剪，实现严格的 Fail-Closed；
   - `packages/ui/Sidebar.tsx` 彻底移除业务菜单硬编码，降级为接收 `sections` 属性的纯 UI 积木；
   - 彻底删除 `apps/tenant/src/lib/` 目录，相关授权服务下沉至 `@base/feature-tenant-admin/server`。

## 影响与后果

- **开发体验极致简化**：未来新增业务切片只需在自身包内声明 `manifest.ts`，保存后全系统（菜单、CASL、权限树）自动生效，彻底根治“改一处动四处”的土豆代码；
- **架构完全合规**：`apps/tenant` 恢复为极薄路由层，`packages/ui` 恢复为纯粹 UI 积木；
- **生产无缝兼容**：完全符合 Next.js 16、Turbopack 与 React 19 RSC 跨端序列化规范。
