# 架构范式与类型健全避坑指南 (Architecture & Types Learnings)

本模块记录在 TypeScript 强类型收敛、零 any 防线以及现代 SaaS 架构范式维度的工程实践。

---

## 1. 全仓清除 TypeScript 原生 enum 语法包袱，坚守 as const 现代范式 (No TS Enum Invariant)

- **痛点**：
  - 传统 TypeScript 原生 `enum` 会被转译为 IIFE 立即执行函数与双向映射对象，不仅污染产物体积，而且对现代 bundler（esbuild, SWC, Turbopack）的隔离编译极不友好；
  - 字符串枚举在 TypeScript 中属于“封闭类型”，外部传入内容相同的普通字符串字面量会被类型检查报错拒绝，逼迫开发者到处写 `as MyEnum` 强转，滋生坏味道；
  - 在底层基础包中残留 `enum FieldPolicy` 与 `enum BizApprovalStatus`，违背了现代 SaaS 前端纯粹性。
- **解法与铁律 (No Enum & as const Standard)**：
  1. **全仓禁止 `export enum`**：
     - 所有常量状态、类型、字典必须 100% 使用 `as const` 常量对象声明；
     - 借助 `typeof + keyof` 语法一行自动推导开放的字面量联合类型：
       ```ts
       export const FieldPolicy = {
         HIDDEN: "HIDDEN",
         READONLY: "READONLY",
         EDITABLE: "EDITABLE",
       } as const;
       export type FieldPolicy = (typeof FieldPolicy)[keyof typeof FieldPolicy];
       ```
  2. **开放联合类型的优势**：
     - 运行时是纯粹干净的 JavaScript 对象（可直接调用 `Object.values()` 供给下拉框或循环）；
     - 编译后无多余 IIFE 胶水，零运行时包袱；
     - 字符串字面量无缝匹配，杜绝一切不安全的 `as ...` 强转。

---

## 2. 严禁用 any 恶性降解，强制端到端强类型可推导

- **痛点**：在复杂数据转换、Prisma 查询、DTO 映射时，部分开发者习惯性手写 `(x as any)` 或跳过类型定义，导致上游一旦重构字段，下游代码不仅无法在编译期捕获错误，反而引发无静默告警的线上运行时白屏。
- **解法与铁律**：
  - 全仓严禁 `any`、`(x as any)` 以及无 SAFETY 注释的暴力强转；
  - 所有输入/输出边界必须通过 Zod Schema 或强类型 Type Guard 收敛；
  - 数据库查询必须完全依托 Prisma 强类型（如 `TenantPrisma.*WhereInput`），确保字段从数据库、服务端 Query、BFF DTO 到前端组件 Props 100% 严格可推导。
