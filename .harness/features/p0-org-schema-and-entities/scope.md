# 修改白名单与边界：【P0】租户组织人事模型与基础实体补齐 (p0-org-schema-and-entities)

## 允许修改的文件与目录 (修改白名单)

- `packages/db-tenant/**`
- `packages/db-control/**`
- `tooling/tenant-migrate/**`
- `packages/features/control-admin/**`
- `packages/features/procurement-center/**`
- `feature_list.json`
- `.harness/features/p0-org-schema-and-entities/**`

## 严禁修改的内容 (受保护区域)

- 严禁擅自修改 `apps/tenant/src/app/(auth)/**` 登录逻辑。
- 严禁改动 CASL 核心语法与授权算法。
