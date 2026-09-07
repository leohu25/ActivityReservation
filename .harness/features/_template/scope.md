# 修改白名单与边界模板：[特性名称] (<feature_id>)

## 允许修改的文件与目录 (修改白名单)

- `packages/features/<feature_id>/**`
- `apps/tenant/src/app/(dashboard)/<route>/**`
- `.harness/features/<feature_id>/**`

## 严禁修改的内容 (受保护区域)

- 严禁擅自修改 `packages/foundation/**`。
- 严禁修改其他非关联 Feature 切片。
