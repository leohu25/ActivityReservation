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

---

## 缺陷修补记录：侧边栏菜单点击触发整页刷新 (2026-09-11)

### 根因

- `packages/ui/.../Sidebar.tsx` 默认 `LinkComponent = DefaultLink`（原生 `<a>`），`apps/tenant` 从未注入 `next/link` → 菜单点击是**整篇文档重新加载**，而非 App Router 客户端跳转；
- 侧边栏当前路径仅靠 `useEffect` 读一次 `window.location.pathname` → 全页刷新后 `openGroups` 重置为空，只剩当前路径命中分组自动展开（即用户看到的“其他菜单全部折叠”）；
- 与 SSR/CSR 选型无关：`headers()` 使 layout 动态渲染只影响 RSC 取数，不会重挂载已挂载的客户端组件（对比 `ControlLayout` 一开始就用 `next/link + usePathname`，平台端无此问题）。

### 修复方案（遵循 Next.js App Router 官方正统范式，彻底摒弃胶水层）

- **彻底删除** `apps/tenant/src/app/(dashboard)/app-sidebar.tsx`（杜绝脱裤子放屁的过度包装）；
- `Sidebar.tsx` 直接官方原生化：
  - 彻底拔除假解耦的 `LinkComponent`、`DefaultLink`（原生 `<a>` 标签）与 `popstate`；
  - 直接 `import Link from "next/link"` 与 `import { usePathname } from "next/navigation"`；
  - 路由状态直接由 `usePathname()` 驱动，保证软导航与 Layout 状态保留；
  - 兼顾单测：支持可选 `currentPath` 覆盖，适配纯 Node 环境 `renderToString` 断言；
- `(dashboard)/layout.tsx` 保持极简：直接引入并渲染 `@chenrun/ui` 导出的 `<Sidebar allowedPermissions={...} />`；
- 保留 `(dashboard)/loading.tsx` 骨架屏，遵循官方 Instant Loading States 范式。

### 验证证据

- `pnpm --filter @chenrun/ui test`：14/14 PASS（100% 通过）
- `pnpm check`：14/14 tasks PASS（0 类型错误）
- `node scripts/check-redlines.mjs`：192 个源码文件 0 红线违规
- 运行时验证：菜单切换为官方 Soft Navigation 局部替换，手风琴展开状态完整保留，零全页刷新。
