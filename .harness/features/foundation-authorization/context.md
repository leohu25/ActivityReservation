# 特性背景：授权核心与能力构建器 (foundation-authorization)

## 一、 目标

集成 Better Auth Organization Dynamic Access Control 与 CASL Ability Factory，将组织成员的动态角色和 Resource -> Actions 权限编译为统一 CASL Ability，并提供服务端与 React 薄适配。

## 二、 范围内能力

1. 建立唯一 Better Auth Access Control statement，覆盖基础组织管理与采购订单功能动作。
2. Organization 插件启用 `ac` 与 `dynamicAccessControl.enabled`，Control DB 增加 Better Auth `OrganizationRole` 模型。
3. Ability Factory 从可信 Tenant Context 的 Organization、User、Member roles 与动态角色权限构建 CASL rules。
4. 服务端提供基于 CASL `ForbiddenError` 的强类型校验与 `@RequireAbility` 薄装饰器/包装契约。
5. React 提供基于 `@casl/react` 的 Ability Context 与 `<Permission>`/`<Can>` 薄适配。
6. 使用现有 PostgreSQL 17 Compose 实库验证动态角色创建、成员角色、权限读取与 Ability 编译。

## 三、 明确不做

- 数据范围 Conditions、部门树、自定义部门与 Prisma `accessibleBy`。
- 字段 HIDDEN/READONLY/EDITABLE 策略。
- 采购订单领域服务、页面和业务状态规则。

## 四、 安全事实

- Better Auth statement 是功能权限唯一事实源；中文 labels 仅是 UI metadata。
- CASL 是服务端和前端统一判断机制，服务端始终为最终安全边界。
- Ability 必须绑定可信服务端解析出的 active Organization，禁止客户端注入 organizationId 或 roles。
- 无匹配权限时默认拒绝。
