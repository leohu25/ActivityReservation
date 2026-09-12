# 架构决策记录 (ADR 0008)：业务能力垂直内聚、选择性 DDD 与三级共享体系

## 状态

已采纳 (Accepted，2026-09-12 术语与结构修订)

> 文件名中的 `fdd-slices-with-ddd-aggregates` 为历史路径。此前把 UI 文件夹归类称为“微观 DDD 聚合根”并不准确；本 ADR 以修订后的决策为准。

## 上下文

Customer Center 早期在 `src/components/` 中平铺客户、报价、门店、分类与标签 UI。第一次治理只把 UI 移入页面概念目录，Contract、Service、Action 和 Types 仍按技术层位于包根，因此没有形成真正的业务垂直内聚。同时，跨业务共享和列表/表单模板仍需明确边界。

## 决策

1. **业务能力垂直内聚**：
   - Customer Center 定位为 Business Area / Feature Group；
   - Customer Management、Store Management、Quotation Management 是 Feature；
   - Classification 是 Customer Management 下的 Sub-Feature；
   - Create Classification 等端到端目标是 Vertical Slice / Use Case；
   - Feature 内就近组织 `contract.ts`、`types.ts`、`service.ts`、`queries.ts`、`actions.ts`、`ui/` 及测试。
2. **不把目录误称为 DDD 模型**：页面或组件目录不自动等于 Aggregate、Subdomain 或 Bounded Context。简单业务不创建完整 DDD 分层；复杂 Feature 出现真实不变量或一致性边界时再按需建模。
3. **三级共享体系**：
   - Level 1：`packages/shared` 与 `packages/ui`，纯技术基础能力；
   - Level 2：`packages/biz-shared`，经过验证的跨业务稳定模式；
   - Level 3：Business Area 内 `src/shared/`，仅供本业务区域多个 Feature 复用。
4. **Next.js 运行时边界**：
   - RSC 读取通过 `public.server.ts` 暴露的 server-only Query；
   - Client mutation 通过 colocated Server Action；
   - `public.ts` 只暴露 Client-safe UI、Contract 与类型；
   - App Router 保持极薄，仅负责框架参数和模块装配。
5. **Schema 驄动表单保留**：通用增改查表单继续优先使用 `@chenrun/ui` 的 Schema 驱动模板，同时保留复杂业务使用原生组合组件的逃生通道。

## 影响与后果

- Customer Center 从 UI 收纳升级为完整业务能力垂直切片；
- 公共 API 按业务语义而非技术层暴露；
- DDD 成为复杂 Feature 的可选建模工具，而不是强制目录模板；
- 共享能力按作用范围逐级提升，避免 `shared` 或 `biz-shared` 膨胀。
