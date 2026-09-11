# 历史归档与 PRD 规格资产 (Archive)

> **归档说明**：本目录收录系统研发初期（2026年9月）撰写的 SaaS 基础设施产品需求规格说明书（PRD）、早期权限闭环设计方案与组织权限模型定义。

---

## 历史文档清单

1. **《SaaS Foundation 权限基础设施工程实施规格》** (`SaaS Foundation 权限基础设施工程实施规格.md`)
   - 形成时间：2026-09-09
   - 历史定位：立项初期指导 AI / Coding Agent 搭建权限基础设施的技术选型与工程规格。
2. **《SaaS Foundation 权限系统完整设计方案》** (`SaaS Foundation 权限系统完整设计方案.md`)
   - 形成时间：2026-09-09
   - 历史定位：权限系统核心理论模型、数据范围引擎与角色权限设计底座。
3. **《SaaS Tenant 全生命周期与用户、员工、组织、权限闭环设计》** (`SaaS Tenant 全生命周期与用户、员工、组织、权限闭环设计.md`)
   - 形成时间：2026-09-09
   - 历史定位：租户从开辟、管理员接管、建立组织到员工离职与注销的业务领域闭环定义。
4. **《SaaS 租户后台产品结构与组织权限模型定义》** (`SaaS 租户后台产品结构与组织权限模型定义.md`)
   - 形成时间：2026-09-09
   - 历史定位：租户端控制台产品功能结构图与角色模型字典。

---

## 现行权威架构索引

以上文档已顺利完成其在立项与基础建设阶段的历史使命，现行系统的生产代码实现与演进规范请统一以以下权威文档为准：

- **系统整体架构总纲与全景索引**：[`docs/ARCHITECTURE.md`](../ARCHITECTURE.md)
- **现行全链路权限架构与原理解析**：[`docs/permissions/permission-architecture-deep-dive.md`](../permissions/permission-architecture-deep-dive.md)
- **多租户 SaaS 架构与隔离机制**：[`docs/architecture/saas-multitenant-architecture.md`](../architecture/saas-multitenant-architecture.md)
- **数据库自愈与演进引擎**：[`docs/architecture/database-migration-engine.md`](../architecture/database-migration-engine.md)
- **垂直切片与动态自发现规范**：[`docs/architecture/fdd-vertical-slice-architecture.md`](../architecture/fdd-vertical-slice-architecture.md)
- **生产与多环境部署实战**：[`docs/deployment/DEPLOYMENT.md`](../deployment/DEPLOYMENT.md)
