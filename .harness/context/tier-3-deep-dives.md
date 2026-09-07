# Tier 3：深度协议与设计细则 (Tier 3 Deep Dives)

> 消费预算：~5,000 Tokens。针对具体 Feature 实现时的细粒度规范。

## 一、 四层权限判定执行链

1. **RBAC 判定**：当前用户的生效角色集中是否包含 `P.<feature>.<resource>.<action>`。
2. **Data Scope 判定**：根据授权的数据范围（`SELF`, `DEPT`, `DEPT_TREE`, `CUSTOM_DEPT`, `ALL`）构建 Repository 查询的 `where` 过滤条件。
3. **Field Policy 判定**：
   - `HIDDEN`：输出序列化时不返回该字段；前端组件不渲染。
   - `READONLY`：前端置灰只读；服务端拦截恶意提交。
   - `EDITABLE`：正常读写。
4. **Business Policy 判定**：领域实体与业务规则断言（例如：单据状态必须为待审核；审批人与创建人不能相同）。

## 二、 数据库隔离与动态路由

1. 请求到达通过 Session Cookie 解析出当前租户 `tenantId`。
2. 通过 Control DB 查询该租户的数据库配置（Host/Port/Database/User/Password）。
3. `TenantDbManager` 从 LRU 缓存池中获取或初始化该租户的专属 Prisma Client 实例。
4. 业务数据查询全部限定在此 Client 执行，彻底杜绝数据交叉。
