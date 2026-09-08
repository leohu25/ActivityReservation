# 修改白名单与边界：【P0】工作台真实拓扑装配与租户访问门禁 (p0-tenant-workbench-real-topology)

## 允许修改的文件与目录 (修改白名单)

- `apps/tenant/src/app/(dashboard)/workbench/**`
- `packages/auth/**`
- `packages/authorization/**`
- `packages/features/procurement-center/**`
- `feature_list.json`
- `.harness/features/p0-tenant-workbench-real-topology/**`

## 严禁修改的内容 (受保护区域)

- 严禁篡改采购订单不可逆状态机与自审禁止红线。
