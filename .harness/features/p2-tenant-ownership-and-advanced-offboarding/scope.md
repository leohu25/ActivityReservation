# 修改白名单与边界：【P2】租户所有权移交与复杂离职批量单据交接 (p2-tenant-ownership-and-advanced-offboarding)

## 允许修改的文件与目录 (修改白名单)

- `packages/features/tenant-admin/**`
- `packages/features/procurement-center/**`
- `feature_list.json`
- `.harness/features/p2-tenant-ownership-and-advanced-offboarding/**`

## 严禁修改的内容 (受保护区域)

- 严禁擅自物理删除已存在的业务订单。
- 严禁产生 0 个 Owner 的瞬态。
