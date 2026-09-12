# 特性推进记录：平台运营商总控面板与租户开通中心 (foundation-platform-admin)

## 一、 当前状态

- 状态：✅ 已完成 (completed)
- 依赖前置：`foundation-migration` (已满足)
- 负责人：implementer (受 coordinator 编排调度与 reviewer 独立审计)
- 完成时间：2026-09-08

## 二、 任务清单与完成记录

- [x] **阶段 1: 架构调研 (Research)**
  - 调度 `researcher` 调研 `packages/db-control`、`packages/db-tenant` 与 `apps/tenant` 现有能力；
  - 明确租户全生命周期状态机 (`PROVISIONING` -> `ACTIVE` <-> `SUSPENDED` / `FAILED`) 与 Database-per-Tenant 自动创建流程。
- [x] **阶段 2: 服务层与底座契约落地 (Service & Contract)**
  - 在 `apps/tenant/package.json` 引入 `@base/db-control` 与 `@base/db-tenant`；
  - 封装平台超管身份识别守卫 (`checkIsPlatformAdmin`, `assertPlatformAdmin`)，默认 Fail-Closed；
  - 实现 `PlatformAdminService`：
    - 查询所有租户列表与其物理数据库状态、Schema 版本及统计卡片（总数、运行中、挂起、故障）；
    - 原子化租户开通 (`provisionTenant`)：创建 Organization、分配初始 Owner、调用 `TenantProvisioner` 自动创建物理库并执行基线迁移升级为 `ACTIVE`；
    - 租户状态切换 (`toggleTenantStatus`)：支持在 `ACTIVE` 与 `SUSPENDED` 之间启停切换，阻断非法中间状态；挂起时切断连接并使路由报错 `TENANT_DATABASE_INACTIVE`。
- [x] **阶段 3: 视图与交互中心构建 (Web Portal)**
  - 落地总控路由 `apps/tenant/src/app/(platform)/platform-admin/`：
    - `layout.tsx`：平台超管鉴权门禁，提供专用平台顶栏与返回工作台入口；
    - `page.tsx` 与 `view.tsx`：运营统计卡片、租户开通 Dialog、租户运维列表；
    - `actions.ts`：Server Actions 直调 Service，严格杜绝内网 self-fetch；
  - 在侧边栏 `Sidebar.tsx` 为平台超管用户提供“平台总控中心”快捷入口。
- [x] **阶段 4: 单元测试与门禁验证 (Verification)**
  - 编写 `apps/tenant/src/lib/auth/platform-admin.test.ts` 专属测试套件；
  - 跑通全仓 7 个测试套件 64/64 单测 100% 通过；
  - 全仓 9/9 packages 类型检查 0 错误，Next.js 生产构建通过；
  - 全栈极速门禁 `./scripts/verify.sh` 100% 通过（沙盒边界合规、69 个源码文件 0 红线违规）。
- [x] **阶段 6: 架构命名统一与最新数智风 UI 全量重构 (Refactor & Design Modernization)**
  - **概念体系收敛**：响应用户架构决策，将概念混淆的 `platform` 全面收敛为 `control`（Control Plane / 控制平面）；
  - **目录与包结构升级**：
    - 将应用目录由 `apps/platform` 正式重命名为 `apps/control`（package: `control`）；
    - 将特性包由 `packages/features/platform-admin` 升级为 `packages/features/control-admin`（package: `@base/feature-control-admin`）；
  - **彻底去除历史包袱与叠词**：
    - 消除 `ControlConsoleClient` 等叠词与暴露框架细节的技术后缀；
    - 删除无用的历史单页大杂烩代码，全面按领域职责正交命名（`ControlLayout`、`ControlMetrics`、`OverviewPage`、`TenantsView`、`TenantsPage`、`ControlLogin`、`ProvisionTenantDialog`、`TenantLifecycleTable`）；
    - 服务层与守卫层彻底清洗（`ControlAdminService`、`assertControlAdmin`、`requireControlAdminSession`、`getControlAuthRuntime`、`ControlStats`、`ControlTenantItem`）；
  - **最新设计规范落地**：
    - 废弃原有杂乱紫色调，统一采用科技皇家蓝（`#1864F5` / `bg-blue-600`）与极浅冷灰蓝背景（`#F4F7FB`）；
    - 100% 清零界面 Emoji，统一使用 `lucide-react` 现代矢量图标；
    - 数据指标全部标配 `tabular-nums font-bold tracking-tight` 等宽排版；
    - 容器统一采用纯白浮动大圆角卡片（`rounded-2xl border border-slate-200/80 bg-white shadow-xs`）与平滑悬停微抬升反馈；
  - **全量门禁与测试跑通**：
    - 全仓 11/11 packages `pnpm check` 0 错误；
    - 专属单测 `control-admin.test.ts` 2/2 PASS，全仓 7/7 套件 64/64 PASS；
    - 生产构建 `pnpm build` 成功（包含 `/overview`, `/tenants`, `/login`）；
    - 全栈门禁 `./scripts/verify.sh` 100% PASS（88 个源码文件 0 红线违规）。

## 三、 验证证据库

- apps/tenant 专属平台总控单测：2/2 PASS (`platform-admin.test.ts`)
- 全仓自动化单测 `pnpm test`：64/64 PASS (7 个测试套件)
- 全仓类型扫描 `pnpm check`：9/9 packages PASS (0 错误)
- 生产构建 `pnpm build`：PASS (Turbopack 编译成功，包含 `/platform-admin`)
- 全栈极速门禁 `./scripts/verify.sh`：PASS (边界合规，69 个源码文件 0 红线违规)
- 会话收尾校验 `./scripts/session-end.sh`：PASS
