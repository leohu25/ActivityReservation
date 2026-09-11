# 修改白名单与边界模板：[特性名称] (<feature_id>)

## 允许修改的文件与目录 (修改白名单)

- `packages/features/<feature_id>/**`
- `apps/tenant/src/app/(dashboard)/<route>/**`
- `.harness/features/<feature_id>/**`

## 附带修改与前置联动 (Spillover / 联动扩围)
>
> 当开发本特性必须联动微调共享库或底层接口契约时在此声明，并注明扩围理由，避免边界拦截阻断正常研发：
<!-- 示例:
- packages/db-tenant/src/contracts/** # 理由：扩展 tenant 模型的新字段契约
- packages/ui/src/components/primitives/badge.tsx # 理由：支持新状态徽标样式
-->

## 严禁修改的内容 (受保护区域)

- 严禁擅自破坏既有包的向后兼容公开导出。
- 严禁修改其他非关联 Feature 业务切片（若发现缺陷，使用 `./scripts/save-patch.sh` 归档补丁并登记至技术债）。
