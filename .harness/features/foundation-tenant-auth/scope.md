# 修改白名单与边界：多租户与身份认证底座 (foundation-tenant-auth)

## 允许修改的文件与目录

- `packages/auth/**`
- `packages/db-control/**`
- `packages/db-tenant/**`
- `apps/tenant/package.json`
- `apps/tenant/src/app/api/auth/**`
- `apps/tenant/src/lib/auth/**`
- `pnpm-lock.yaml`
- `.harness/features/foundation-tenant-auth/**`

## 严禁修改的内容

- 严禁修改授权核心 `packages/authorization/**`；动态角色与 CASL 属于后续特性。
- 严禁修改采购中心及其他业务 Feature。
- 严禁从 Cookie、请求头或租户代码拼接数据库连接串。
- 严禁提供默认租户回退；必须以已认证 Session 的 `activeOrganizationId` 为唯一租户入口，并验证有效 Member。
- 严禁将数据库密码或明文连接串写入 Control DB；只能保存 `secretRef`。
