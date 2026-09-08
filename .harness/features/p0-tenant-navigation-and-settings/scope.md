# 修改白名单与边界：【P0】租户后台多级导航与企业/基础/安全设置中心 (p0-tenant-navigation-and-settings)

## 允许修改的文件与目录 (修改白名单)

- `packages/ui/**`
- `packages/features/tenant-admin/**`
- `apps/tenant/src/app/(dashboard)/settings/**`
- `pnpm-lock.yaml`
- `feature_list.json`
- `.harness/features/p0-tenant-navigation-and-settings/**`

## 严禁修改的内容 (受保护区域)

- 严禁擅自修改采购业务单据状态机。
- 严禁篡改 Better Auth 底层 Session 验证逻辑。
