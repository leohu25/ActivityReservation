# Next.js 与数据通信避坑指南 (Next.js & Server Actions Learnings)

本模块记录在 Next.js 16 App Router、React 19 Server Components (RSC)、Server Actions、跨端序列化防线中的避坑经验。

---

## 1. Server Component 与 Data Fetching 核心规范

- **痛点**：在 Next.js App Router 的 Server Component 内部使用 `fetch('/api/...')` 或 `axios` 调用本地 API Route，会产生无意义的自请求网络往返，且丢失服务端的 Cookie、Session 与租户上下文。
- **解法与铁律**：
  - **Server Component 必须直调 Application Service**：服务端页面直接 `await listCustomersQuery(...)`，直连数据库与业务服务，0 网络往返；
  - **禁止伪 API 绕调**：API Route 仅供外部系统 Webhook 或微前端调用，应用内部页面严禁绕道调用；
  - **Server Action 仅作为 Web Mutation 适配器**：Server Action 负责接收用户提交、鉴权门禁、参数清洗并调用领域 Service，最后通过 `revalidatePath` 或重定向触发数据同步。

---

## 2. 严禁主观猜测与私造轮子，坚持官方规范 (Official Recipes First)

- **痛点**：
  - 遇到 Next.js RSC 跨端报错 `Only plain objects can be passed. Decimal objects are not supported` 时，凭借猜测手写脆弱的深递归函数或 ad-hoc 字符串转换，不仅容易漏转导致运行时崩溃，而且遇到复杂嵌套结构时性能低下；
  - 引入三方库时未查阅其真实规范，漏掉了官方明确要求的配置配方。
- **解法与行为契约**：
  - **首查官方文档 (Official Recipes First)**：遇到三方库行为、版本破坏性变动或边缘报错，第一时间检索官方标准配方；
  - **对齐成熟生态规范**：如 Prisma Decimal 与 Date 的序列化，在 `@base/shared` 中沉淀通用的 `toPlainData`，严格消灭 `any`，全面对齐强类型与序列化契约；
  - **坚持工业级标准**：能用业界经过充分生产验证的成熟库（如 `radash`、`dayjs`、`superjson`、`Intl`）解决的问题，严禁手写脆弱轮子。
