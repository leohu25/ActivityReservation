# 修改白名单与边界：【P0】租户开通与初始数据种子初始化 (p0-tenant-seed-and-provisioning)

## 允许修改的文件与目录 (修改白名单)

- `packages/features/control-admin/**`
- `packages/db-tenant/**`
- `packages/db-control/**`
- `apps/control/**`
- `feature_list.json`
- `.harness/features/p0-tenant-seed-and-provisioning/**`

## 严禁修改的内容 (受保护区域)

- 严禁 Platform Admin 成为租户 Organization 的 Member（遵循 R-01 规则）。
- 严禁篡改采购业务切片。
