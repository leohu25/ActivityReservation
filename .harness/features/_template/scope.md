# 修改白名单与边界模板：[特性名称] (<feature_id>)

## 允许修改的文件与目录 (修改白名单)

- `packages/features/<feature_id>/**`
- `apps/tenant/src/app/(dashboard)/<route>/**`
- `.harness/features/<feature_id>/**`

## 附带修改与前置联动 (Spillover / 联动扩围)
>
> 必须联动微调共享库时在此声明。**按目录通配符聚合，禁止逐文件流水账**。
> 自动扩围（`check-boundary.mjs`）已折叠为：单文件精确路径；同目录 ≥2 文件 `dir/**`，并标注 `N files @ commit`。
<!-- 示例:
- `packages/ui/src/components/primitives/badge.tsx` # 1 file @ abc1234，支持新状态徽标
- `packages/features/customer-center/**` # 12 files @ abc1234，分页契约联动
-->

## 严禁修改的内容 (受保护区域)

- 严禁擅自破坏既有包的向后兼容公开导出。
- 严禁修改其他非关联 Feature 业务切片（若发现缺陷，使用 `./scripts/save-patch.sh` 归档补丁并登记至技术债）。
