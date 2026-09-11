# 架构决策记录 (ADR 0006)：应用层内核装配 (Kernel Assembly) 与支撑业务切片彻底解耦

## 状态

已采纳 (Accepted) - 修订并超载 ADR-005 第 3 条

## 上下文

在 ADR-005 中，系统引入了 `TenantFeatureManifest` 与构建期自发现机制（`scripts/sync-features.mjs`）。然而为了追求 `apps/tenant` 的极致代码清空，ADR-005 做出了一个权宜妥协：

- 将生成的 `registry.generated.ts` 和全局授权运行时服务放置在 `packages/features/tenant-admin` 中；
- 导致 `tenant-admin` 在 `package.json` 中反向依赖了兄弟业务切片 `@chenrun/feature-customer-center` 与 `@chenrun/feature-procurement-center`。

### 带来的架构破损与隐患

1. **反向依赖与依赖倒置失控**：`tenant-admin` 属于“系统管理与组织架构”业务切片，本应与其他业务切片平级，却因为承担了全局 Manifest 聚合职责，变成了其他所有业务切片的上层消费者，每新增一个业务模块都必须修改 `tenant-admin`；
2. **切片间横向耦合**：其它业务页面获取当前用户权限时必须从 `@chenrun/feature-tenant-admin/server` 引入 `getTenantSubjectPermissions`，导致系统管理业务切片污染了所有业务域；
3. **心智模型混淆**：使开发者误以为 `tenant-admin` 是“基础设施框架”，产生目录划分的混乱。

## 决策

1. **确立应用层内核装配职责 (`apps/tenant/src/kernel/`)**：
   - 应用（App）在 Monorepo 体系中的核心本质是 **“装配者 (Assembler)”**，它天然处于依赖拓扑的最顶端，依赖所有业务切片是完全合规且合理的；
   - 在 `apps/tenant/src/kernel/` 建立纯净的装配内核：
     - `registry.generated.ts`：由构建脚本统一生成在此处，汇聚所有已安装的 `TenantFeatureManifest`；
     - `permissions.ts`：承载 Server Component 专用的 `getTenantSubjectPermissions` 强类型纯数据权限读取引擎；
     - `navigation.ts`：承载服务端导航过滤引擎 `getAuthorizedTenantNavSections`。

2. **支撑业务切片彻底解耦 (`packages/features/tenant-admin`)**：
   - 彻底移除 `tenant-admin` 对 `@chenrun/feature-customer-center` 和 `@chenrun/feature-procurement-center` 的工作区依赖；
   - 移除 `tenant-admin` 内部生成的 `registry.generated.ts` 与 `server/get-tenant-ability.ts`；
   - 权限树展示组件 `RolePermissionManager` 采用 **控制反转 (IoC)** 规范，通过 Page Props (`permissionTree`) 由宿主应用页面在 SSR 时从 `@/kernel` 注入，不再内联全局注册表。

3. **保留 `packages/features/control-admin` 单切片全包架构**：
   - 鉴于平台运营管控端（Control）以多租户生命周期开通、冻结与数据迁移为绝对核心，无动态业务插件插拔诉求，继续保持单切片全包模式以实现最高开发性价比。

## 影响与后果

- **切片完全自包含与零耦合**：所有 `packages/features/*` 之间绝对禁止互相依赖，新增切片只需声明 `manifest.ts`，无需触碰任何现有切片；
- **消除循环依赖死锁**：避免了将全局注册表下沉到基础库（`@chenrun/authorization`）引发的拓扑环；
- **结构清晰**：`apps/tenant/src/kernel/` 作为显式的“装配内核”，边界分明，防止业务代码向应用层回流。
