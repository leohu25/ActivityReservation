# 会话换手交接单 (Session Handoff)

## 基本信息与目标

- **目标特性**：SaaS Web 门户与主面板框架 (`foundation-web-shell`)
- **当前状态**：已完成 (Completed)
- **当前分支**：`gemini`
- **最后更新**：2026-09-08T14:00:00Z

## 本次会话完成内容

- 在根目录与 `apps/tenant` 配置不进 Git 的 `.env.local` 环境变量，直连本地 Docker PostgreSQL 容器端口 (`127.0.0.1:55432`)。
- 将单 `page.tsx` 重构为标准 Next.js 16 App Router 路由结构：
  - `/`：门户引导页；
  - `/(auth)/login`：全屏登录/注册独立页面；
  - `/(dashboard)/layout`：统一 ERP 布局框架；
  - `/(dashboard)/workbench`：实库连接与四层权限可视化控制台；
  - `/(dashboard)/procurement/orders`：采购订单业务切片页面。
- 引入 **shadcn/ui** 核心组件（`Button`, `Card`, `Input`, `Badge`, `cn`），与字段三态 `<PermissionField>` 深度融合。
- 前后端真实对接，通过 Better Auth 会话与 Control DB 动态查询组织和成员，实时编译 CASL Ability 并执行 `@casl/prisma` 条件下推，彻底消除写死数据。
- 编写 UI 专属单测，全仓 5 个测试包共 42 个自动化单测全部通过。
- 全栈门禁与 Next.js 生产构建（`pnpm build`）100% 通过。

## 门禁验证证据

| 检查项 | 结果 |
| :--- | :--- |
| UI 专属单元测试 | 3/3 PASS |
| 全仓自动化单元测试 | 42/42 PASS |
| 全仓 TypeScript 类型检查 | 8/8 PASS |
| Next.js 生产环境构建 | PASS（包含 6 个 App Router 动静态路由） |
| 全栈极速门禁自检 | PASS（边界合规、56 个源码无红线违规） |
| 环境可重启性自检 | PASS（./init.sh 环境就绪） |
| 会话收尾与交接状态校验 | PASS（./scripts/session-end.sh 通过） |

## 遗留风险与注意事项

- 本地 PostgreSQL 容器正常保持运行在 `127.0.0.1:55432`，环境变量由 `.env.local` 本地驱动。
- 下一特性为 `foundation-migration`（多租户数据库迁移引擎）。

## 下一会话启动指引

1. 运行 `./init.sh` 确认环境。
2. 将 `member.local.md` 中的 `active_feature_id` 设为 `foundation-migration`。
3. 推进多租户迁移 CLI 工具与版本升级。
