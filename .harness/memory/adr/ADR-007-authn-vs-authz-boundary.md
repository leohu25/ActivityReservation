# ADR-007: Better Auth 与 CASL 职责边界（认证与业务授权分离）

## 状态

Accepted（2026-09-12）

## 背景

工程同时引入 Better Auth（Organization 插件）与 CASL。历史上曾预留
`organizationAccessControl` / `toBetterAuthStatement` 双轨，但生产装配
`createOrganizationAccessControl({})` 业务 statement 为空，真正业务授权
全部由 Control DB 角色 JSON + `CaslAbilityFactory` 承担。

若不写清边界，后续开发可能误用 Better Auth `hasPermission` 查询业务资源，
导致「以为配了、实际未生效」。

## 决策

**路径 A（采用）：单引擎业务授权**

| 层 | 负责方 | 职责 |
|----|--------|------|
| 认证与会话 | Better Auth | 登录、注册、Session、`activeOrganizationId` |
| 组织成员 | Better Auth Organization | 成员关系、内置角色名 `owner` / `admin` / `member` |
| 业务权限 | **仅 CASL** | 功能动作、数据范围、字段三态、按钮/接口/查询下推 |

### 明确规则

1. **禁止**使用 Better Auth `hasPermission` / applicationStatement 判定业务
   资源（Customer、PurchaseOrder 等）。
2. 业务动作唯一声明处：各页 `contracts/*.contract.ts`，经 manifest → Catalog。
3. 超管（owner）规则唯一生成处：`CaslAbilityFactory.buildOwnerActionRules()`。
4. Server Component 下发纯数据：`getTenantSubjectPermissions` 从 Catalog
   派生动作清单（标准动作 + 契约自定义动作）。
5. Server Action 写路径应 `ability.can(action, subject)`（采购已齐；客户中心
   按 Phase 5 逐步对齐）。

### 不采用路径 B 的原因

把 Catalog `toBetterAuthStatement()` 注入 BA 需要与 Control DB 角色 JSON
双写一致，且 BA role 类型 invariance 增加耦合；在单体 SaaS 现阶段收益低于成本。

## 后果

- 新同学只需理解：**进门看 BA，屋里干什么看 CASL**。
- 角色配置 UI 只维护 CASL 侧（页面契约 → 权限树）。
- 若未来要对 BA 暴露业务 permission API，须另开 ADR 并保证与 Catalog 同源。

## 参考

- `.harness/features/arch-authz-consolidation/`
- `packages/auth/src/server/server.ts`
- `packages/authorization/src/ability/ability-factory.ts`
