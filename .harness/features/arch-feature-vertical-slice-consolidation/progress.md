# 进展记录

- [x] 任务沙盒、术语与范围基线建立
- [x] Customer Center 业务垂直切片迁移
- [x] RSC Query 与 mutation Action 分离
- [x] 公共 API 与租户调用方原子切换
- [x] 架构门禁与文档术语收敛
- [x] 审查问题修复（反向依赖解耦、rowKey 保护、Store 关联裁剪、Tag 授权契约对齐、编辑 Action 闭环）
- [x] 独立 Reviewer 全量代码审计通过 (Merge verdict: OK)
- [x] 更新开发技能手册 (.agents/skills/erp-feature-dev/references/*.md)
- [x] Tenant Admin 业务垂直切片重构（组织架构、角色权限、系统设置、工作台闭环，读写分离，语义子路径导出）
- [x] 全局内置角色枚举下沉至 @chenrun/authorization，统一服务命名为 service.ts
- [x] scripts/ 目录按单一职责原则归类重构（check/, sync/, reporter/, tools/），物理清理所有空壳胶水文件并更新全仓调用索引
- [x] 新增业务垂直切片架构完整性自动化门禁 check-vertical-slices.mjs 并接入 verify.sh
- [x] 登记新特性 arch-data-scope-and-base-entity-audit（实体基础审计字段规范与客户中心数据权限闭环）与沙盒初始化
- [x] 最终全量门禁与生命周期收尾 (DoD)
