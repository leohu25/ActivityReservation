# 特性背景：【P0】工作台真实拓扑装配与租户访问门禁 (p0-tenant-workbench-real-topology)

## 一、 目标与背景

依据《SaaS Tenant 全生命周期与用户、员工、组织、权限闭环设计》第 42-44 节规范：
完成第一梯队的最终端到端权限自驱装配与访问门禁闭环验证。

彻底解决当前系统两个重大遗留缺陷：

1. **工作台写死 Mock 拓扑问题**：
   彻底移除 `apps/tenant/src/app/(dashboard)/workbench/page.tsx` 中写死的 `dept_procurement_east` 静态拓扑，接入 `resolveEmployeeTopology`，从租户物理库自驱读取当前登录人的 `EmployeeProfile` 及真实部门树，动态装配 CASL 权限并在工作台展示当前身份、所属部门与生效数据范围。
2. **租户访问硬门禁 (Tenant Access Gate)**：
   在 `resolveTenantContext` 与租户端页面守卫处，断言 `EmployeeProfile.status === 'ACTIVE'`。被停用（`SUSPENDED`）或离职（`TERMINATED`）的员工，即便拥有租户 Session 也立即被 Fail-Closed 阻断，无法访问租户业务页面与 Server Actions。
3. **数据权限实时联动验证**：
   当管理员在组织架构中调换员工部门后，该员工访问采购订单中心（`/procurement/orders`）时，列表数据范围根据 `accessibleBy` 立即依据新部门树实时过滤下推，无需手动清除缓存。

## 二、 详细设计规格 (Specification)

### 1. 工作台重构 (`workbench/page.tsx`)

- 移除：

  ```ts
  // 彻底删除静态 mock 拓扑
  const topology = {
    userId: session.user.id,
    departmentId: "dept_procurement_east",
    departmentTreeIds: ["dept_procurement_east", "dept_procurement_east_sub"],
  };
  ```

- 替换为真实动态装配：

  ```ts
  const topology = await resolveEmployeeTopology(
    {
      findEmployeeProfile: async (memberId: string) =>
        tenantPrisma.employeeProfile.findUnique({
          where: { memberId },
          select: { id: true, memberId: true, departmentId: true, employeeNo: true, jobTitle: true, status: true }
        }),
      findAllDepartments: async () =>
        tenantPrisma.department.findMany({ select: { id: true, parentId: true } })
    },
    { userId: tenantCtx.user.id, memberId: tenantCtx.member.id }
  );
  ```

- 界面卡片展示当前登录人的真实员工档案信息（姓名、工号、职务、所属部门名称、所辖部门拓扑数量、当前角色、生效数据范围）。

### 2. 租户访问硬门禁 (`packages/auth/src/tenant-context.ts` 或 Server Actions 统一拦截)

```ts
export function assertEmployeeActive(profile: { status: string } | null): void {
  if (!profile) {
    throw new Error("您在该企业中尚未建立有效的员工档案，请联系管理员分配");
  }
  if (profile.status === "SUSPENDED") {
    throw new Error("您在该企业的员工账号已被暂停访问，请联系管理员");
  }
  if (profile.status === "TERMINATED") {
    throw new Error("您已从该企业离职，无权访问内部业务数据");
  }
  if (profile.status !== "ACTIVE") {
    throw new Error("员工档案状态异常");
  }
}
```

## 三、 范围内能力

1. 重构 `apps/tenant/src/app/(dashboard)/workbench/page.tsx`。
2. 在租户访问层接入 `assertEmployeeActive` 门禁。
3. 编写端到端集成测试，验证调部门后数据范围即时下推联动与停用人员即时拦截。

## 四、 明确不做

- 不做外部邮件邀请（交由第三梯队 P2 特性）。
