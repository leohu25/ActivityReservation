# 特性任务看板：SaaS Web 门户与主面板框架 (foundation-web-shell)

- [x] 在根目录与 `apps/tenant` 建立不入 Git 的 `.env.local` 环境变量配置文件，直连本地 PostgreSQL 容器端口 (`127.0.0.1:55432`)
- [x] 基于 Next.js 16 App Router 重构路由与页面体系，彻底消除单 page.tsx 模式：
  - `src/app/page.tsx`：根门户引导路由
  - `src/app/(auth)/login/page.tsx`：独立登录与注册认证路由
  - `src/app/(dashboard)/layout.tsx`：统一控制台后台布局（Header + Sidebar + Shell）
  - `src/app/(dashboard)/workbench/page.tsx`：直连 PostgreSQL 实库的工作台与四层权限联动面板
  - `src/app/(dashboard)/procurement/orders/page.tsx`：采购中心订单列表与动态 CASL / 数据范围下推业务路由
- [x] 深度集成 **shadcn/ui** 设计体系：
  - 在 `@chenrun/ui` 中集成 `Button`, `Card`, `Input`, `Badge` 及 `cn()` 工具函数
  - 将 `<PermissionField>` 与 shadcn/ui 无缝融合，支持 `HIDDEN`, `READONLY`, `EDITABLE`
- [x] 前后端完全真实打通：
  - 通过 Better Auth 前后端客户端实现真实登录、注册与租户切换
  - 服务端直连 Control DB 查询组织与成员，动态调用 `CaslAbilityFactory` 编译 `PrismaAbility`，拒绝写死数据
- [x] 专属单元测试（`packages/ui` 3/3 PASS）与全仓测试（5/5 packages，42/42 PASS）全部通过
- [x] 全仓类型检查 `pnpm check`（8/8 packages PASS）与 Next.js 生产构建（`pnpm build`）100% 通过
- [x] 全栈门禁验证（`./scripts/verify.sh` 与 `./init.sh`）完全通过

## 验证记录

- `pnpm --filter @chenrun/ui test`：3/3 PASS
- `pnpm test`：5/5 packages，42/42 PASS
- `pnpm check`：8/8 packages PASS
- `pnpm build`：PASS（包含 6 个 App Router 动静态路由）
- `./scripts/verify.sh`：PASS（边界合规、56 个源码无红线违规）
- `./init.sh`：PASS
