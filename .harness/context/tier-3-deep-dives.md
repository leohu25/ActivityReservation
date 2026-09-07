# Tier 3：深度协议与设计细则 (Tier 3 Deep Dives)

> 消费预算：~5,000 Tokens。针对具体 Feature 实现时的细粒度规范。

## 一、 四层权限判定执行链 (Better Auth + CASL)

1. **RBAC 功能动作判定**：Better Auth 校验当前成员角色是否具备对应资源的操作动作（例如 `statement["procurement.order"]` 中的 `create`, `read`, `audit`）。
2. **Data Scope 数据范围判定**：Ability Factory 将 `role_data_scope`（`SELF`, `DEPT`, `DEPT_TREE`, `CUSTOM`, `ALL`）编译为 CASL Conditions，通过 `@casl/prisma` 的 `accessibleBy(ability, "read").PurchaseOrder` 直接下推为 Prisma `where` 过滤条件。
3. **Field Policy 字段权限判定**：CASL Fields 原生支持：
   - `HIDDEN`：无 `read` 权限，Response 序列化不返回，前端不渲染。
   - `READONLY`：有 `read` 无 `update` 权限，前端置灰只读，服务端拦截变更。
   - `EDITABLE`：同时具备 `read` 与 `update` 权限。
4. **Business Policy 业务规则判定**：Feature 领域实体断言（例如：单据状态必须为 Pending；审批人与创建人不能相同）。CASL 负责授权边界，领域规则保留在 Feature 内部。

## 二、 数据库隔离与动态路由

1. 请求到达通过 Session Cookie 解析出当前租户 `tenantId`。
2. 通过 Control DB 查询该租户的数据库配置（Host/Port/Database/User/Password）。
3. `TenantDbManager` 从 LRU 缓存池中获取或初始化该租户的专属 Prisma Client 实例。
4. 业务数据查询全部限定在此 Client 执行，彻底杜绝数据交叉。
