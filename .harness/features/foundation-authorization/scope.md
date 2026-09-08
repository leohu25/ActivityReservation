# 修改白名单与边界：授权核心与能力构建器 (foundation-authorization)

## 允许修改的文件与目录

- `packages/auth/**`
- `packages/authorization/**`
- `packages/db-control/**`
- `packages/features/procurement-center/src/permissions.ts`
- `apps/tenant/package.json`
- `apps/tenant/src/app/api/auth/**`
- `apps/tenant/src/lib/auth/**`
- `apps/tenant/src/lib/authorization/**`
- `pnpm-lock.yaml`
- `.harness/features/foundation-authorization/**`

## 严禁修改的内容

- 严禁修改租户数据库路由与租户隔离语义。
- 严禁提前实现数据范围、字段权限与 `@casl/prisma` 查询下推；这些属于 `foundation-advanced-authz`。
- 严禁在服务端或前端裸写资源/动作魔术字符串；统一复用权限目录与强类型 Action/Subject。
- 严禁自研权限判定引擎；功能权限由 Better Auth Dynamic Access Control 提供，统一能力判断由 CASL 提供。
- 严禁修改采购订单领域逻辑或其他 Feature。
