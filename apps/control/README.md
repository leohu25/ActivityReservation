# 平台运营管控端应用 (Platform Control Plane)

`apps/control` 是基于 **Next.js 16 (App Router)** 构建的**平台运营管控平面宿主应用**。

依据 **ADR-004** 与 **ADR-006** 架构规范，本项目面向 SaaS 平台运营商与超级管理员，负责全平台租户开通 (Provisioning)、物理库生命周期管理、超级管理员身份守卫与多租户数据迁移中枢。

---

## 一、核心职责与架构定位

1. **多租户生命周期管控**：租户组织创建、独立物理数据库自动开通（CREATE DATABASE）、数据库配额与连接池治理；
2. **总控库管理与运维**：直接操作平台总控库 (`saas_control`)，管理全局租户台账 (`organization`)、用户总表 (`user`) 与租户物理库映射 (`tenant_database`)；
3. **平台级 Fail-Closed 鉴权守卫**：只有登录用户邮箱存在于环境变量 `CONTROL_ADMIN_EMAILS` 白名单内，才允许访问管控平面。

---

## 二、Next.js 官方生命周期自愈架构 (`instrumentation.ts`)

遵循 Next.js 官方规范，平台端实现了**应用内聚的 Day 0 自愈机制**（位于 `src/instrumentation.ts`）：

- **执行时机**：Next.js Node 服务端实例启动时自动执行一次；
- **底层驱动**：调用 `@base/db-migrate` 模块化接口 `ensurePlatformDatabase()`；
- **事务与咨询锁**：在 PostgreSQL 咨询锁保护下检查总控库状态。若处于空库或未就绪状态，自动执行最新 Baseline 建表，并基于 Better Auth 同源哈希算法播种初始超管账号；
- **控制台自描述**：服务启动即打印 `[Control DB] 平台总控库自愈就绪`，无需任何外部前置脚本。

---

## 三、本地开发与启动

### 启动服务

```bash
# 在仓库根目录执行（默认端口 3001）
pnpm run dev:control
```

### 环境变量配置

复制专属环境模板：

```bash
cp .env.example .env.local
```

关键配置项：

- `PORT=3001`：本地服务端口
- `CONTROL_DATABASE_URL`：平台总控库 PostgreSQL 直连连接串
- `CONTROL_ADMIN_EMAILS`：平台超级管理员邮箱白名单（逗号分隔）
- `PLATFORM_BOOTSTRAP_ADMIN_*`：初始超管账号、邮箱与初始密码

---

## 四、工程与依赖规范

1. **单切片全包模式 (ADR-006)**：平台管控业务逻辑集中收敛于 `@base/feature-control-admin`，应用层保持极薄装配；
2. **物理隔离红线**：管控端只允许连接与访问平台总控库，严禁在此应用中硬编码直连任何租户独立物理数据库。
