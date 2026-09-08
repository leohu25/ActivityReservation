# 特性任务看板：多租户与身份认证底座 (foundation-tenant-auth)

## 一、 阶段任务

- [x] 配置 Better Auth 1.7.3 + Prisma adapter + Organization 插件
- [x] 建立 Prisma 7.10 PostgreSQL Control DB Schema 与生成配置
- [x] 暴露 Next.js `/api/auth/[...all]` App Router Handler
- [x] 实现基于服务端 Headers + Better Auth `auth.api.getSession` 的可信 Tenant Context 入口
- [x] 实现基于 `secretRef` 且关闭竞态安全的 Tenant DB Manager
- [x] 编写拒绝路径、契约、隔离、缓存、并发、关闭竞态与释放测试
- [x] 使用本地 PostgreSQL 17 完成真实 Better Auth 租户上下文集成验证
- [x] 运行专属测试、类型检查、生产构建与可重启自检

## 二、 实际验证记录

- `pnpm --config.dangerouslyAllowAllBuilds=true install`：PASS，9 个 Workspace 安装完成。
- `CONTROL_DATABASE_URL=postgresql://user:pass@localhost:5432/saas_control pnpm --filter @chenrun/db-control prisma:validate`：PASS，Schema valid。
- 同环境变量运行 `pnpm --filter @chenrun/db-control generate`：PASS，Prisma Client 7.10.0 生成成功。
- `pnpm --filter @chenrun/auth test`：PASS，10/10（含 Better Auth 构造、Organization API、可信 Headers 入口及 Handler 导出）。
- `pnpm --filter @chenrun/db-control test`：PASS，3/3（含 Prisma Organization/Member/Session Schema 契约）。
- `pnpm --filter @chenrun/db-tenant test`：PASS，8/8（含关闭期间并发 drain 与 fail-closed）。
- `pnpm check`：PASS，8/8 packages。
- `pnpm build`：PASS，Next.js 生产构建成功，Auth 路由为动态服务端路由。
- `docker compose up -d --wait saas-control-postgres`：PASS，`chenrun-saas-control-postgres` 健康，绑定 `127.0.0.1:55432`。
- 使用本地连接执行 `pnpm --filter @chenrun/db-control db:push`：PASS，`saas_control.public` 与 Prisma Schema 同步。
- `pnpm --filter @chenrun/auth test:integration`：PASS，1/1；真实注册、Organization/Member、active Session、TenantDatabase 映射及可信 Tenant Context 全链路通过，并精准清理测试数据。
- 集成后 PostgreSQL 定向残留查询：测试用户、Organization、TenantDatabase 映射均为 0。
- 复跑现有单测：Auth 10/10、Control DB 3/3、Tenant DB 8/8，合计 21/21 PASS。
- `./scripts/verify.sh` 与 `./init.sh`：PASS。
