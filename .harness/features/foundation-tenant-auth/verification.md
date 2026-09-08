# 专属验证规范与证据：多租户与身份认证底座 (foundation-tenant-auth)

## 验证结果

| 检查项 | 命令 | 结果 |
| :--- | :--- | :--- |
| 依赖安装 | `pnpm --config.dangerouslyAllowAllBuilds=true install` | PASS |
| Prisma Schema | `CONTROL_DATABASE_URL=postgresql://user:pass@localhost:5432/saas_control pnpm --filter @chenrun/db-control prisma:validate` | PASS |
| Prisma Client | 同环境变量运行 `pnpm --filter @chenrun/db-control generate` | PASS，v7.10.0 |
| Auth/Tenant Context | `pnpm --filter @chenrun/auth test` | PASS，10/10 |
| Control DB Repository / Schema | `pnpm --filter @chenrun/db-control test` | PASS，3/3 |
| Tenant DB Manager | `pnpm --filter @chenrun/db-tenant test` | PASS，8/8 |
| 全仓类型检查 | `pnpm check` | PASS，8/8 |
| Next.js 生产构建 | `pnpm build` | PASS |
| 全栈门禁 | `./scripts/verify.sh` | PASS，27 个变更边界合规、20 个源码无红线、8/8 类型检查 |
| 可重启自检 | `./init.sh` | PASS |
| Reviewer | 独立代码与安全审查 | PASS / Merge verdict OK |
| 暂存区 | `git diff --cached --name-only` | 空，NO STAGED FILES |

## 安全断言

1. 未认证、Session/User 不匹配、无 active Organization、无 Member、无映射及非 ACTIVE 映射全部 fail-closed。
2. `TenantDatabase` 只保存 `secretRef`，不含密码与明文连接 URL。
3. Tenant DB Manager 只将 `secretRef` 交给受信 `SecretResolver`，不拼接连接串。
4. 同 Organization 并发首次访问只创建一次；不同 Organization 客户端隔离；关闭期间拒绝新获取并 drain/disconnect 所有初始化中客户端。
5. Next.js `server-only` 入口从 `headers()` 调用 Better Auth `auth.api.getSession`，请求调用方不能提供 Session 或 tenant ID。
6. Auth 使用惰性服务端初始化，构建期不读取或硬编码数据库 URL/Secret。
