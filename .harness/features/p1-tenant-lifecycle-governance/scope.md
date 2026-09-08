# 修改白名单与边界：【P1】租户全生命周期管控与排期安全清理 (p1-tenant-lifecycle-governance)

## 允许修改的文件与目录 (修改白名单)

- `packages/features/control-admin/**`
- `apps/control/**`
- `packages/db-control/**`
- `packages/db-tenant/**`
- `feature_list.json`
- `.harness/features/p1-tenant-lifecycle-governance/**`

## 严禁修改的内容 (受保护区域)

- 严禁在停用租户时调用全局用户封禁（遵循 R-04）。
- 严禁在删除未完成物理库销毁前清理 Control DB Organization 映射（遵循文档第 60 节）。
