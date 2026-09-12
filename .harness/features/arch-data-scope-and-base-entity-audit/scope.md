# 修改白名单与边界：通用实体审计基础字段规范与客户中心数据权限闭环 (arch-data-scope-and-base-entity-audit)

## 允许修改的文件与目录 (修改白名单)

- `packages/features/customer-center/**`
- `packages/features/procurement-center/prisma/schema.prisma`
- `packages/db-tenant/prisma/**`
- `scripts/check-entity-baseline.mjs`
- `scripts/check-entity-baseline.test.mjs`
- `scripts/verify.sh`
- `scripts/sync-tenant-schema.mjs`
- `tooling/db-migrate/**`
- `apps/tenant/src/app/(dashboard)/customer/**`
- `.harness/features/arch-data-scope-and-base-entity-audit/**`

## 附带修改与前置联动 (Spillover / 联动扩围)

- `packages/authorization/**` # 拓扑与数据范围工具函数适配（如需）
- `feature_list.json` # 特性状态事实源更新

## 严禁修改的内容 (受保护区域)

- 严禁破坏 PostgreSQL 物理隔离逻辑；
- 严禁破坏原有 RBAC 动作权限契约；
- 严禁擅自修改除当前特性受控切片外的其他已稳定特性核心逻辑。

- `README.md` # 1 file @ 7f5fa7c7，联动修改自动登记
