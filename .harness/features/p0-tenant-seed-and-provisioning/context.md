# 特性背景：【P0】租户开通与初始数据种子初始化 (p0-tenant-seed-and-provisioning)

## 一、 目标与背景

遵循《SaaS Tenant 全生命周期与用户、员工、组织、权限闭环设计》第 14-24 节规范，并落实“免外部邮件邀请、直接开号可用”的极速闭环原则。

平台管理员在控制总控（`apps/control` 的 `/tenants` 页面）开通新租户时，不仅完成物理数据库创建和迁移，还必须自动完成租户独立物理库的基线种子数据初始化（Seed）：

1. 直接为 Owner 创建已验证用户和初始密码（免去等待接收激活邮件的阻断点）；
2. 代表 Owner 创建 Organization 并建立 Owner 成员身份；
3. 开通物理数据库并执行基线 Migration；
4. **Tenant DB 基线 Seed**：创建企业根部门 `ROOT (企业总公司)` 与基础岗位字典；
5. **在租户库为 Owner 创建首个 EmployeeProfile**（状态直接为 ACTIVE 在职态）；
6. **在 Control DB 初始化预置四层角色策略**（`owner`, `admin` 等）；
7. 租户物理库状态直接置为 `ACTIVE`，Owner 拿账号密码即可无障碍直接登录。

## 二、 详细设计规格 (Specification)

### 1. `ControlAdminService.provisionTenant` 升级规格

```ts
export class ControlAdminService {
  /**
   * 平台管理员开通租户并自动完成物理库 Seed 与 Owner 初始化
   */
  async provisionTenant(
    input: ProvisionTenantInput,
    operatorUser: { email?: string | null }
  ): Promise<ProvisionTenantResult>;
}
```

- **基线 Seed 详细数据契约**：
  - **部门根节点 (Department)**：

    ```ts
    {
      id: "dept_root",
      name: input.name, // 直接使用企业名称作为根部门名称
      code: "ROOT",
      parentId: null,
      sort: 0,
      status: "ACTIVE"
    }
    ```

  - **默认岗位字典 (Position)**：

    ```ts
    [
      { name: "总经理", code: "pos_gm", description: "企业最高管理负责人", sort: 1, status: "ACTIVE" },
      { name: "部门主管", code: "pos_supervisor", description: "部门业务管理负责人", sort: 10, status: "ACTIVE" },
      { name: "业务专员", code: "pos_specialist", description: "基层核心业务经办人员", sort: 20, status: "ACTIVE" }
    ]
    ```

  - **Owner 员工档案 (EmployeeProfile)**：

    ```ts
    {
      id: `emp_owner_${Date.now()}`,
      userId: adminUser.id,
      memberId: ownerMember.id,
      employeeNo: "E0001",
      nameSnapshot: adminUser.name,
      emailSnapshot: adminUser.email,
      departmentId: "dept_root",
      jobTitle: "企业所有者",
      status: "ACTIVE",
      joinedAt: new Date()
    }
    ```

  - **预置四层角色 (OrganizationRole)**：
    初始化 `owner` 具备全资源全操作；`admin` 具备系统管理全部功能；`buyer` 具备采购订单新建与部门下推查看。

## 三、 范围内能力

1. 升级 `TenantProvisioner` 与 `ControlAdminService`，支持物理建库后自动执行 Tenant DB Seed。
2. 自动化生成初始密码（如 `Admin123456!`）并反馈至总控开通结果弹窗，支持一键复制凭据。
3. 单元测试覆盖租户开通全流程与 Tenant DB Seed 结果核验。

## 四、 明确不做

- 不做外部 SMTP 邮件发送。
