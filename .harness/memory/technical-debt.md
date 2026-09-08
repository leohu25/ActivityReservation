# 技术债与架构漂移收敛台账 (Technical Debt & Architectural Drift)

> 本台账用于智能体在开发或审查过程中，登记发现的非当前 Feature 修改范围的历史遗留问题、不规范代码或架构漂移。
> **原则：严禁擅自借开发新特性之机顺手大改无关代码！一律先在此处登记，交由协调者统一评估排期。**

---

## 登记格式与规范

| 编号 | 登记日期 | 登记人/角色 | 所在文件/模块 | 漂移/债务描述 | 推荐收敛方案 | 优先级 | 处理状态 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| DEBT-001 | 2025-05-18 | @coordinator | 根目录 | 初始骨架搭建待引入模块化 Monorepo 依赖扫描工具 | 配置 tooling/boundary-check 静态检查 | 中 | 待排期 |
| DEBT-002 | 2026-09-08 | @implementer | packages/db-tenant, apps/tenant | 租户物理库连接池需补充 LRU 容量上限保护与闲置连接主动回收 | 在 TenantDbManager 引入 LRU 缓存与断连保活 | 低 | 待排期 |
| DEBT-003 | 2026-09-08 | @coordinator | packages/auth, packages/db-control | 平台超级管理员当前采用环境变量白名单 (PLATFORM_SUPERADMIN_EMAILS) 静态守卫，尚未在 Control DB 建立 platform_role 动态角色表 | V1 版本保持静态白名单以确保防提权物理安全与极简交付；后续 V2 阶段再引入 Control DB platform_role 动态角色分配表与平台多运维角色（客服/财务）分权控制台，并保留环境变量作为兜底后门 | 低 | 暂不处理(V2演进) |
| DEBT-004 | 2026-09-08 | @coordinator | packages/db-tenant, packages/authorization | 租户独立库尚未建立 employee_profile 表，当前用户部门拓扑 (UserDepartmentTopology) 由会话模拟注入 | 在 Tenant DB 增加 employee_profile 表关联 memberId 与 departmentId，实现自动根据租户员工档案装配部门数据范围拓扑 | 中 | 待排期 |
| DEBT-005 | 2026-09-08 | @coordinator | packages/authorization | 字段级导出权限 (Export) 与敏感数据掩码脱敏 (Mask) 尚未作为通用管道落地 | 待后续在报表导出与通用表单中补充 Field Policy 的 Mask 策略中间件 | 低 | 待排期 |

---

## 已收敛记录归档

*(暂无已归档技术债)*
