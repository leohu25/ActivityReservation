# 特性背景与技术决策 (Context) — arch-eliminate-search-dsl-and-adopt-prisma-native-relations

## 一、 问题背景与历史包袱剖析

在垂直切片架构下，销售订单（`SalesOrder`）、采购订单（`PurchaseOrder`）等主单据表通常仅存储外键编码（如 `customer_code`, `store_code`），并未直接存储客户企业名称或门店名称。但在用户界面，操作员输入的搜索关键字通常为业务名称（如“绿叶餐饮”、“西湖银泰店”），而非冷冰冰的单号。

历史开发者为了避免在每个模块手写反查代码，设计了私有的元数据 DSL（`SearchContract` 与 `executeSearchContract` 动态反射引擎）。然而，该设计存在三大严重缺陷：

1. **类型退化与暴力强转**：Prisma Client 官方为静态生成的强类型 Class，没有声明字符串索引签名，导致 Service 业务层被迫写出 `const dbClient = client as unknown as Record<string, unknown>;` 及免责注释；
2. **私有 DSL 破坏 AI 协作与生态支持**：全网没有任何开源库使用该私有 DSL，AI 编程助手（Claude/Cursor/Copilot）难以准确理解和自动生成该结构；
3. **认知误区**：误以为“数据库不能建物理外键”就等于“Prisma Schema 不能写 `@relation`”，从而人工阻断了 Prisma 的关系感知能力。

## 二、 核心技术决策

1. **启用 Prisma 官方逻辑外键模式 (`relationMode = "prisma"`)**：
   - 在 `packages/base/db-tenant` 与租户 Schema 聚合层配置 `relationMode = "prisma"`；
   - 数据库底层（PostgreSQL）**坚决不生成物理 Foreign Key Constraint**，杜绝外键死锁与跨模块硬级联风险；
   - ORM 层通过 `@relation` 获得端到端强类型关系感知能力。

2. **全面拥抱 Prisma 官方范式 A（嵌套关系过滤）**：
   - 在 `SalesOrder` 模型中声明逻辑关联 `customer Customer? @relation(...)` 与 `store CustomerStore? @relation(...)`；
   - 查询条件直接利用 Prisma 原生强类型 `customer: { customerName: { contains: keyword, mode: "insensitive" } }`，一条 SQL 子查询直达，零反查胶水代码。

3. **彻底物理拔除私有搜索 DSL**：
   - 物理删除 `@base/shared` 中的 `keyword-search-engine.ts` 等私有 DSL 文件；
   - 业务切片全面升级为纯粹原生的强类型 Where 组装；
   - 净化门禁脚本与全栈开发规范。
