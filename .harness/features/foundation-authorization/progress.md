# 特性任务看板：授权核心与能力构建器 (foundation-authorization)

- [x] 建立 Better Auth Access Control statement 与强类型权限目录
- [x] 通过应用 composition root 聚合采购切片权限且保留 Better Auth 默认 statements/roles
- [x] 启用 Organization Dynamic Access Control
- [x] 增加 Control DB `OrganizationRole` Schema 与组织隔离查询
- [x] 实现动态/内置角色权限到 CASL Ability 的编译器
- [x] 实现服务端 `RequireAbility`/`ForbiddenError` 薄适配
- [x] 实现 React AbilityProvider、Can 与 Permission 组件
- [x] 编写单元测试与 PostgreSQL 17 实库集成测试
- [x] 运行 check、build、verify 与 init

## 验证记录

- Prisma validate/generate/db push：PASS，Prisma 7.10.0，PostgreSQL 17 实库 Schema 同步。
- `pnpm --filter @chenrun/auth test`：10/10 PASS。
- `pnpm --filter @chenrun/authorization test`：7/7 PASS；覆盖目录校验、默认拒绝、多角色并集、owner/admin 静态权限、坏 JSON/未知/跨组织、catalog-bound 服务端与 React adapter。
- `pnpm --filter @chenrun/db-control test`：4/4 PASS。
- `pnpm --filter @chenrun/authorization test:integration`：1/1 PASS；使用 authorization 包内测试权限 fixture，真实验证注册、Organization、动态角色、跨组织同名角色、Member buyer 角色、CASL 编译闭环；foundation 测试不反向依赖 procurement。
- `pnpm check`：8/8 packages PASS；`catalog.type-contract.tsx` 的 `@ts-expect-error` 已紧邻对应 JSX attribute，证明未知 action/subject 无法编译且 directive 被实际消费，合法 catalog 常量可编译。
- `pnpm build`：PASS，`/api/auth/[...all]` 使用应用 AC composition root。
- `./scripts/verify.sh`：PASS，29 个变更文件边界合规、33 个源码无红线违规。
- `./init.sh`：PASS，可重启。
- 实库清理后 `user|organization|organizationRole|tenant_database`：`0|0|0|0`。
- `git diff --check`：PASS；Git 暂存区为空（NO STAGED FILES）。
