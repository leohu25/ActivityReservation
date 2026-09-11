# 特性背景：权限体系统一排查与收敛重构 (arch-authz-consolidation)

## 一、 业务目标与需求背景

- **As a** 租户管理员 / 开发者（AI vibe coding）
- **I want** 角色配置、页面按钮、运行时权限、后端校验四者始终同一事实源
- **So that** 配了就生效、没配就拦住；页面 hide 的操作立刻从角色目录消失；新增受控按钮只需改契约 + 页面

### 已确认的架构骨架（不推翻）

```
contracts/*.contract.ts  →  manifest.permissionModules
        ↓
sync-features.mjs  →  registry.generated.ts
        ↓
globalTenantPermissionTree / Catalog / NavSections
        ↓
RolePermissionManager · Ability · DataTable
```

契约 → 角色树这条主链**健康**。本次不是推倒重来，而是补齐旁路、消灭双份实现、收紧 enforcement。

### 产品约定（已与用户对齐）

1. 页面默认全量声明按钮；不需要时用 `hideView/hideEdit/hideDelete` 或不写该 Button。
2. 普通用户仍按权限隐藏；owner 超管权限全量。
3. 页面已关闭的操作 → 契约同步移除 action → 角色配置不再出现。

## 二、 核心问题清单（排查结论）

| ID | 问题 | 后果 | 优先级 |
|----|------|------|--------|
| P1 | `getTenantSubjectPermissions` 硬编码 6 个 action | 新 action 配了页面收不到；幽灵 action owner 假授权 | P0 |
| P2 | Customer「停用/启用」extraAction 未挂 action | 角色勾不到、后端拦不住 | P0 |
| P3 | customer-center Server Action 无 action 级 CASL | 藏按钮 ≠ 安全，接口可绕过 | P0 |
| P4 | owner 放行逻辑散落 4 处 | 改策略易漏；roles 页字符串判断绕过 CASL | P1 |
| P5 | 字段三态：工厂 / 角色 UI / 前端 plain ability 三套规则 | 「配了没生效」体感 | P1 |
| P6 | tenant-admin 平行 `PagePermissionDescriptor` 类型 | 双份定义易漂移 | P1 |
| P7 | Better Auth 业务 statement 为空，双轨名存实亡 | 认知负担，误用 BA hasPermission 会错 | P1 |
| P8 | hide 约定未贯穿契约（业务侧零使用） | 角色目录仍偏长 | P2 |
| P9 | `StandardAction` 含未使用 detail/print/import/batch_delete | 幽灵枚举 | P2 |
| P10 | 加受控按钮改动面 5–7 处 | AI/人易漏改 | P2 |

## 三、 目标终态

1. **单一动作源**：页面权限下发 action 集合 = 该页契约 `actions`（经 Catalog）。
2. **单一超管源**：owner 规则仅在 Ability 工厂生成；其它处 `can()`。
3. **单一字段源**：`resolveFieldMode` 在 authorization，UI 与工厂共用。
4. **单一类型源**：FeaturePagePermissionDescriptor 只在 authorization。
5. **Enforcement 对齐**：UI 能藏的按钮，Server Action 同 action 名强制校验。
6. **BA/CASL 分工书面化**：BA=会话/成员；CASL=业务权限（推荐路径 A）。
7. **约定可测试**：View 用到的 action ⊆ contract.actions；hide 后契约同步。

## 四、 明确不做

- 不推翻契约/manifest/registry 架构。
- 不在本特性内做「导航完全自动派生」（可另开特性，需 override 设计）。
- 不引入第三套权限框架。
- 不在未获用户确认前把 customer 写路径收紧上线（P3 需单独确认节点）。
