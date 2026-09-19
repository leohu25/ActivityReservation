# Next.js App Router 与 CASL 权限系统黄金实践：请求级去重、骨架提升与双层缓存全景解析

> **适用场景**：多租户 SaaS / 企业级大型 ERP 系统架构设计  
> **核心议题**：彻底根除“切换路由卡顿”、“同页面多模块权限重复查库”反模式，解析 Next.js 部分渲染（Partial Rendering）、`React.cache()` 请求级去重与客户端 React Context 的协同工作机制。

---

## 目录

- [一、 痛点背景：为什么刚开始切换路由会“顿一下”？](#一-痛点背景为什么刚开始切换路由会顿一下)
- [二、 架构全貌：双层缓存与请求收敛时序图](#二-架构全貌双层缓存与请求收敛时序图)
- [三、 第一层防线：服务端 `React.cache()` 请求级去重](#三-第一层防线服务端-reactcache-请求级去重)
- [四、 第二层防线：Layout 骨架提升与 Next.js 局部渲染（Partial Rendering）](#四-第二层防线layout-骨架提升与-nextjs-局部渲染partial-rendering)
- [五、 前后端全生命周期场景流转对照表](#五-前后端全生命周期场景流转对照表)
- [六、 架构边界与工程权衡（Trade-offs）](#六-架构边界与工程权衡trade-offs)
- [七、 总结与最佳实践准则](#七-总结与最佳实践准则)

---

## 一、 痛点背景：为什么刚开始切换路由会“顿一下”？

在企业级中后台系统中，一个大业务域（如“客户中心”或“组织人事”）往往包含多个关联子模块。以客户中心为例，外层布局（Layout）通常需要一次性获得该业务域下所有子资源的鉴权状态，用于控制子页面的组件渲染、操作按钮显示与字段脱敏：

```tsx
// 业务域外层布局：apps/tenant/src/app/(dashboard)/customer/layout.tsx
export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 5 个模块的权限并发查询
  const [customer, store, quote, category, tag] = await Promise.all([
    getTenantSubjectPermissions(CustomerSubject),
    getTenantSubjectPermissions(CustomerStoreSubject),
    getTenantSubjectPermissions(CustomerQuoteSubject),
    getTenantSubjectPermissions(CustomerCategorySubject),
    getTenantSubjectPermissions(CustomerTagSubject),
  ]);

  return (
    <CustomerAbilityBoundary
      permissions={{ customer, store, quote, category, tag }}
    >
      {children}
    </CustomerAbilityBoundary>
  );
}
```

### 未优化前的性能灾难（5 倍雪崩效应）

表面上看，`Promise.all` 发起的是并发操作。但在没有请求级缓存控制的情况下，底层代码执行了以下动作：

```text
getTenantSubjectPermissions("Customer")         ──> 查租户Session ──> 查用户Member ──> 查Roles ──> 查Rules ──> 构建Ability A
getTenantSubjectPermissions("CustomerStore")    ──> 查租户Session ──> 查用户Member ──> 查Roles ──> 查Rules ──> 构建Ability B
getTenantSubjectPermissions("CustomerQuote")    ──> 查租户Session ──> 查用户Member ──> 查Roles ──> 查Rules ──> 构建Ability C
getTenantSubjectPermissions("CustomerCategory") ──> 查租户Session ──> 查用户Member ──> 查Roles ──> 查Rules ──> 构建Ability D
getTenantSubjectPermissions("CustomerTag")      ──> 查租户Session ──> 查用户Member ──> 查Roles ──> 查Rules ──> 构建Ability E
```

1. **数据库连接池瞬时被打穿**：单次页面渲染，同一个用户的角色权限表被**重复查询了 5 次**，累计产生数十条高频重复 SQL；
2. **CPU 内存密集实例化**：CASL 的 `Ability` 规则树在 Node.js 堆内存中被**重复实例化了 5 次**；
3. **用户感知顿挫**：页面路由初次载入或切换时，服务端处理延迟增加 300ms ~ 800ms，界面产生明显的卡顿和白屏等待。

---

## 二、 架构全貌：双层缓存与请求收敛时序图

为根治上述痛点，我们设计并实施了 **“服务端请求去重（React.cache）+ 客户端骨架驻留（Context Hoisting）”** 的双层防线：

```text
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 用户点击大模块进入 /customer                                                                           │
└───────────────────────────────────┬───────────────────────────────────────────────────────────────────┘
                                    │ 触发一次 HTTP 请求 (RSC Request)
                                    ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 【服务端 Server Component - 阶段一】                                                                  │
│  apps/tenant/src/app/(dashboard)/customer/layout.tsx                                                  │
│                                                                                                       │
│  Promise.all([                                                                                        │
│    getTenantSubjectPermissions("Customer"),      ───┐                                                 │
│    getTenantSubjectPermissions("CustomerStore"), ───┼─► 命中 React.cache(getCachedTenantAbilityContext) │
│    getTenantSubjectPermissions("CustomerQuote"), ───┤   【仅执行 1 次真实 DB 查询并构建 Ability 单例】 │
│    getTenantSubjectPermissions("Category"),      ───┤   其余 4 个并发请求直接复用内存 Ability 计算结果  │
│    getTenantSubjectPermissions("Tag")            ───┘                                                 │
│  ])                                                                                                   │
│  ▼ 序列化下发 (toPlainData 纯 JSON 描述)                                                              │
└───────────────────────────────────┬───────────────────────────────────────────────────────────────────┘
                                    │ HTML / RSC Stream 响应注入前端
                                    ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 【客户端 Client Component - 阶段二】                                                                  │
│  <CustomerAbilityBoundary permissions={{ customer, store, quote, category, tag }}>                   │
│                                                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 浏览器内存层：React Context (常驻挂载)                                                           │  │
│  │                                                                                                 │  │
│  │  用户在子路由之间切换（例如从 /customer/customers 跳转到 /customer/stores）：                   │  │
│  │  1. Next.js 局部渲染（Partial Rendering）生效：外层 Layout 保持挂载，根本不向服务端重复请求！   │  │
│  │  2. 仅重新拉取 stores/page.tsx 的业务表格数据；                                                 │  │
│  │  3. 前端 StoreView 渲染时，直接从头顶 Context 秒读现成权限，0 毫秒开销，0 次权限构建！           │  │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 三、 第一层防线：服务端 `React.cache()` 请求级去重

### 1. 核心源码落地

在权限内核层 (`apps/tenant/src/kernel/permissions.ts`)，使用 React 官方提供的 `cache(...)` 将多租户 Ability 工厂构建过程包装为记忆化函数：

```ts
// apps/tenant/src/kernel/permissions.ts
import { cache } from "react";
import { headers } from "next/headers";
import { getCurrentTenantContext, getServerAuthRuntime } from "@base/auth";
import { CaslAbilityFactory } from "@base/authorization";
import { globalTenantCatalog } from "./registry.generated";

/**
 * 缓存单次请求周期内的 TenantContext 与 CASL Ability
 *
 * 机制：在同一个 HTTP 请求/RSC 渲染通道内，无论 Layout 或下层组件调用多少次，
 * 底层仅查询一次数据库、仅在内存中编译一次全量 Ability 实例！
 */
const getCachedTenantAbilityContext = cache(async () => {
  const reqHeaders = await headers();
  const runtime = getServerAuthRuntime();
  const tenantCtx = await getCurrentTenantContext(reqHeaders);

  const factory = new CaslAbilityFactory(
    runtime.tenantContextRepository,
    globalTenantCatalog,
  );

  // 仅此一次：并行拉取租户规则与用户角色
  const [ability, roleNames] = await Promise.all([
    factory.createForTenant(tenantCtx),
    factory.resolveMemberRoleNames(tenantCtx),
  ]);

  return {
    factory,
    tenantCtx,
    ability,
    roleNames,
  };
});
```

### 2. 消费端透明接入

对外暴露的 `getTenantSubjectPermissions` 无需任何外部缓存参数，直接消费记忆化上下文：

```ts
export async function getTenantSubjectPermissions(
  subject: string,
): Promise<TenantSubjectPermissions> {
  // 这 5 个并发请求同时进入此函数
  const { factory, tenantCtx, ability, roleNames } =
    await getCachedTenantAbilityContext();

  const declaredActions = globalTenantCatalog.getDeclaredActions(subject);
  const allowedActions: string[] = [];

  // 直接在已编译好的 Ability 内存单例上进行轻量级布尔判定
  for (const act of declaredActions) {
    if (ability.can(act as never, subject as never)) {
      allowedActions.push(act);
    }
  }

  // 配合字段级策略解析 (Field-level Policies)
  const fieldPolicies = await factory.resolveFieldPoliciesForSubject(
    tenantCtx,
    subject,
  );

  return toPlainData({
    actions: allowedActions,
    fieldPolicies,
  });
}
```

### 3. 请求级去重的本质特征

- **作用域仅限单次 HTTP 请求（Per-Request）**：请求开始时创建，请求完成向浏览器输出响应后，内存随之自动被 V8 引擎垃圾回收（GC）；
- **零跨会话污染**：不同租户、不同用户的请求彼此完全物理隔离，绝不存在“用户 A 读到了用户 B 的权限缓存”的安全穿透风险；
- **并发友好（Deduplication）**：即使 5 个 Promise 属于同一时钟 Tick 的宏/微任务并发，`React.cache()` 也能精准合并为一个运行中的 Promise，后面的执行方静默挂起并直接等待同一结果返回。

---

## 四、 第二层防线：Layout 骨架提升与 Next.js 局部渲染（Partial Rendering）

很多开发者误以为在同一个大模块下切换子页面时，代码里仍然在不停地发请求只是“命中了缓存”。**事实比这更为彻底：写在 `layout.tsx` 里的权限逻辑压根就没有被执行！**

### 1. 骨架与插槽模式（Shell & Slot）

Next.js App Router 采用树形路由组织：

```text
/customer/
├── layout.tsx         ──> 骨架 (Shell): 负责注入全局 AbilityProvider Context
├── customers/page.tsx ──> 插槽 A (Slot A): 仅负责渲染客户列表表格
└── stores/page.tsx    ──> 插槽 B (Slot B): 仅负责渲染门店列表表格
```

在 React 组件运行时树中，它们呈现标准的嵌套外壳形态：

```tsx
<CustomerLayout>                 {/* 骨架 Shell：持有权限 Context */}
  <CustomerAbilityBoundary permissions={{...}}>
    {/* 动态插槽 Slot */}
    <CustomersPage />
  </CustomerAbilityBoundary>
</CustomerLayout>
```

### 2. 局部渲染（Partial Rendering）的生命周期真相

当用户在界面侧边栏或 Tab 栏中，从 `/customer/customers` 点击切换到 `/customer/stores` 时：

1. **Next.js 路由差异比对（Diffing）**：
   路由引擎发现当前 URL 处于同一个父级路由段 `/customer` 下；
2. **只换内胆，不换外壳**：
   - Next.js **仅向服务端请求目标子路由 `stores/page.tsx` 的 RSC Payload**；
   - **完全跳过 `customer/layout.tsx` 的服务端执行**！
3. **客户端 Context 零开销驻留**：
   - 浏览器中的 `<CustomerAbilityBoundary>` 始终处于挂载（Mounted）状态，从未被卸载（Unmounted）；
   - 新挂载的 `StoreView` 客户端组件调用 `useCustomerAbility()` 时，直接读取头顶已有的 React Context 内存引用；
   - **服务端 0 次运算，客户端 0 次网络开销，页面瞬间无缝呈现！**

---

## 五、 前后端全生命周期场景流转对照表

| 用户操作场景                                                                           | 服务端 `React.cache()` 行为                                                                             | 客户端 React Context 行为                                     | 最终性能与体验效果                                           |
| :------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------ | :----------------------------------------------------------- |
| **场景 A：首次访问或硬刷新 (F5)**（用户直接打开 `/customer/customers`）                | 缓存未命中，执行 **1 次** DB 查询构建 Ability；5 个并发子模块合并复用。响应发出后缓存销毁。             | 客户端重新接收纯 JSON 权限数据，初始化挂载 Context Provider。 | 数据库仅承担 1 次鉴权查询，消除 5 倍雪崩，页面首屏极速呈现。 |
| **场景 B：同业务域内子路由切换**（从 `/customer/customers` 跳转到 `/customer/stores`） | **服务端 Layout 代码完全不执行**（仅执行 `stores/page.tsx` 数据查询）。                                 | Context **全程驻留未卸载**，子页面直接同步读内存。            | **0 次权限构建，0 网络延迟**，丝滑切换。                     |
| **场景 C：跨业务域切换**（从 `/customer` 跳转到 `/organization`）                      | 旧 Layout 卸载，新 Layout 执行。`React.cache()` 在新请求中为组织架构的 4 个模块执行 **1 次** 聚合构建。 | 旧 Context 卸载，挂载新的 `OrgAbilityBoundary`。              | 仅消耗 1 次全新域的构建开销，杜绝重复计算。                  |
| **场景 D：写操作提交 (Server Action)**（用户在页面点击“新增客户”并提交表单）           | Server Action 独立请求中，通过 `assertDomainAbility` 再次实时判定当前权限。                             | 成功后通过 Toast 反馈，本地或无缝 Revalidate 数据。           | 保持坚固的“纵深防御（Defense in Depth）”安全防线。           |

---

## 六、 架构边界与工程权衡（Trade-offs）

任何工业级架构都是在权衡中取舍。理解本模式的边界，才能在业务演进中游刃有余：

### 1. 权限热更新（实时性）与极速体验的权衡

- **客观表现**：若系统管理员在“角色管理”中临时取消了某用户的“门店查看权限”：
  - 如果该用户当前停留在 `/customer/customers` 页面且未刷新，直接在界面点击进入 `/customer/stores`；
  - 由于 Layout 保持挂载，前端 Context 依旧持有旧的权限数据，页面侧边栏或按钮可能仍然显示；
  - **但安全防线绝对不会被击穿**：因为当该页面调用服务端 Query 或提交 Action 时，后端的 `assertDomainAbility` 会实时校验当前数据库中的最新权限，并立刻抛出 `ForbiddenError` 进行物理硬拦截；
  - 用户只需按一次 **F5 刷新** 或切换大导航，前端视图即可立刻同步最新权限。
- **为何这是业界公认的最优解？**
  在企业级应用中，**管理员修改权限是极低频事件（月级或周级）**，而**普通用户的日常页面跳转是极高频事件（秒级）**。绝不能为了迎合 0.01% 的极低频改动，让用户在 99.99% 的日常操作中忍受每次点击都全量查库的顿挫感。

### 2. 为什么不把全系统所有模块的权限全部放到根 Layout？

有开发者提出：_“既然提升到 Layout 这么好，为什么不在全局根布局 `app/(dashboard)/layout.tsx` 把全系统几十个业务切片的权限一次性查完下发？”_

**严禁这种反模式，必须坚持按“业务域（Business Area）”分级下发：**

1. **防止根 HTML 严重臃肿（Payload Bloat）**：几十个模块的权限与字段策略可能多达数百 KB，一次性注水会导致首屏加载变慢；
2. **保持高内聚低耦合**：`@domain/customer-center` 应该只感知自己的契约，不应当把采购、库存、财务的权限强行揉杂在全局；
3. **按需加载（Pay as you go）**：用户今天只用到了客户管理，就只为客户管理加载权限，未访问的模块 0 资源消耗。

---

## 七、 总结与最佳实践准则

本实践方案已全面落地于本项目底座，并被严格收录至架构标准。在后续进行任何新切片开发或架构重构时，请坚守以下 **4 项铁律**：

1. **共享服务端鉴权必须包裹 `React.cache()`**：所有从数据库拉取会话、用户角色、生成 CASL Ability 的根方法，必须使用 `cache()` 装饰，严禁在同一请求周期内重复查库；
2. **大业务域坚持“骨架与插槽”模式**：同一大域下的子模块权限，统一提升至域级 `layout.tsx` 并发拉取，并通过声明式 `<*AbilityBoundary>` 向下传递；
3. **严禁 RSC 跨端透传非序列化数据**：服务端向 Client Context 传递的权限对象，必须经由 `toPlainData` 收敛为纯 JSON 结构（`{ actions: string[], fieldPolicies: Record<string, FieldAccessMode> }`），禁止传递类实例与包含方法的对象；
4. **前端视觉剪枝，后端绝对防御**：前端 Context 仅用于操作按钮与视觉元素的安全隐藏（体验层）；所有真正的数据读取（`queries.ts`）与状态变更（`actions.ts`）首行必须依赖 CASL `assertDomainAbility` 强拦截，实现坚不可摧的纵深安全闭环。
