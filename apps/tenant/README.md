# 租户业务端应用 (Tenant SaaS Data Plane)

`apps/tenant` 是基于 **Next.js 16 (App Router)** 构建的**多租户数据平面宿主应用**。

依据 **ADR-004** 与 **ADR-006** 架构规范，本项目定位为**极薄装配层 (Thin Assembler)**，负责整合各垂直业务切片与横向平台底座，对外暴露 Web 路由与页面访问。

---

## 一、核心职责与架构定位

1. **极薄装配层**：自身仅负责路由声明 (`src/app/`)、布局骨架 (`DashboardShell`) 与安全门禁，严禁在应用层内堆积重度业务领域逻辑；
2. **应用内核装配 (`src/kernel/`)**：
   - `registry.ts`（`@runtime/tenant`）：由 `@runtime/tenant#codegen` 自动发现并聚合所有已安装的 `TenantFeatureManifest`；
   - `permissions.ts`：承载 Server Component 专用的 `getTenantSubjectPermissions` 强类型纯数据权限读取；
   - `navigation.ts`：承载服务端导航过滤引擎 `getAuthorizedTenantNavSections`；
3. **多租户物理分库路由**：基于会话中的 `activeOrganizationId`，通过 `@base/db-tenant` 的 `TenantDbManager` 动态路由至租户独立物理数据库。

---

## 二、本地开发与启动

### 启动服务

```bash
# 在仓库根目录执行（默认端口 3000）
pnpm run dev:tenant
```

> 💡 **构建拓扑特性**：
> 启动前 Turborepo 会自动执行 `generate`（依赖 `@runtime/tenant#codegen` / `@runtime/db#codegen`）；若各切片的 `manifest.ts` 或 Schema 未发生改动，基于文件 Hash **命中 FULL TURBO 缓存跳过**；若有改动则自动完成静态代码聚合与 Prisma Client 生成再拉起应用。

### 环境变量配置

复制专属环境模板：

```bash
cp .env.example .env.local
```

关键配置项：

- `PORT=3000`：本地服务端口
- `BETTER_AUTH_SECRET`：认证加密密钥
- `CONTROL_DATABASE_URL`：平台总控库连接串（用于会话认证与租户路由）

---

## 三、工程开发红线与规范

1. **业务逻辑下沉**：所有业务组件、契约、Server Actions 与 Prisma 数据模型必须沉淀在 `packages/features/*` 中，严禁在 `apps/tenant` 内部平铺私有业务代码；
2. **纯数据序列化隔离**：RSC Server Component 仅允许向 Client Component 传递纯数据，严禁透传未标 `"use server"` 的服务端函数；
3. **权限四维契约闭环**：页面统一消费 `@base/authorization` 的 `TenantAbilityProvider`，交互必须由 CASL 强类型守卫保护。
