# 避坑指南与工程实践库 (Learnings)

本文档记录团队在开发过程中踩过的坑与最佳实践：

## 1. 权限与字符串

- **痛点**：AI 经常随手编写字符串 `"procurement.order.create"`，稍有笔误（如拼成复数 `orders`）就会导致权限穿透或权限失效。
- **解法**：必须使用 `P.procurement.order.create`。在 CI/Verify 中加入静态检查，扫描裸权限字符串。

## 2. 数据库连接池与动态路由

- **痛点**：Database-per-Tenant 频繁创建 PrismaClient 会导致连接池泄露和数据库连接占满。
- **解法**：在 `TenantDbManager` 中维护有容量上限（LRU 策略）的 Client 缓存池，并合理设置连接生命周期。

## 3. Server Component 与 Data Fetching

- **痛点**：Next.js App Router 中 Server Component 内部 `fetch('/api/...')` 会产生自请求网络往返，且丢失 Cookie/Session 上下文。
- **解法**：Server Component 必须直调 Application Service，Server Action 仅作为 Web Mutation 适配器。
