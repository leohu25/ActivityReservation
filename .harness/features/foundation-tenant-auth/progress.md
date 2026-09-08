# 特性任务看板：多租户与身份认证底座 (foundation-tenant-auth)

## 一、 阶段任务

- [x] 配置 Better Auth 1.7.3 + Prisma adapter + Organization 插件
- [x] 建立 Prisma 7.10 PostgreSQL Control DB Schema 与生成配置
- [x] 暴露 Next.js `/api/auth/[...all]` App Router Handler
- [x] 实现基于服务端 Headers + Better Auth `auth.api.getSession` 的可信 Tenant Context 入口
- [x] 实现基于 `secretRef` 且关闭竞态安全的 Tenant DB Manager
- [x] 编写拒绝路径、契约、隔离、缓存、并发、关闭竞态与释放测试
- [x] 运行专属测试、类型检查与生产构建

## 二、 实际验证记录

- `pnpm --config.dangerouslyAllowAllBuilds=true install`：PASS，9 个 Workspace 安装完成。
- `CONTROL_DATABASE_URL=postgresql://user:pass@localhost:5432/saas_control pnpm --filter @chenrun/db-control prisma:validate`：PASS，Schema valid。
- 同环境变量运行 `pnpm --filter @chenrun/db-control generate`：PASS，Prisma Client 7.10.0 生成成功。
- `pnpm --filter @chenrun/auth test`：PASS，10/10（含 Better Auth 构造、Organization API、可信 Headers 入口及 Handler 导出）。
- `pnpm --filter @chenrun/db-control test`：PASS，3/3（含 Prisma Organization/Member/Session Schema 契约）。
- `pnpm --filter @chenrun/db-tenant test`：PASS，8/8（含关闭期间并发 drain 与 fail-closed）。
- `pnpm check`：PASS，8/8 packages。
- `pnpm build`：PASS，Next.js 生产构建成功，Auth 路由为动态服务端路由。
- `./scripts/verify.sh`：PASS，24 个变动文件边界合规、20 个源码文件红线扫描通过。
