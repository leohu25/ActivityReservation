import { hashPassword } from "better-auth/crypto";
import { generateUuidV7, resolvePagination } from "@base/shared";
import type { ControlPrismaClient } from "@base/db-control";
import type { TenantPrismaClient, TenantPrisma } from "@base/db-tenant";
import type { PrismaQueryCondition } from "@base/authorization";
import type {
  DirectCreateEmployeeInput,
  EmployeeItem,
  EmployeeListFilter,
  ListEmployeesFilter,
  ListEmployeesResult,
  TransferDepartmentInput,
  TransferPositionInput,
  TransferRolesInput,
} from "./types";

/**
 * 员工档案与全生命周期管理服务 (Employee Management Service)
 * 职责：
 * 1. 负责多维联动检索租户内员工档案列表（部门树级联下推、岗位与角色筛选）；
 * 2. 负责直接录入建号模式，原子化完成 Control DB 账号创建与 Tenant DB 档案绑定；
 * 3. 负责员工调岗（Position != Role 解耦）与调部门（自增 authorizationVersion 驱动 CASL 即时生效）；
 * 4. 负责员工停用（SUSPENDED）与恢复，停用即时自增权限版本号，严格遵循 R-04（租户停用严禁封禁全局 User）。
 */
export class EmployeeManagementService {
  /**
   * 服务端分页与多维条件联合检索员工档案列表 (标准范式)
   */
  async listEmployeesPaged(
    tenantPrisma: TenantPrismaClient,
    controlPrisma: ControlPrismaClient,
    orgId: string,
    filter: ListEmployeesFilter = {},
    accessibleWhere?: PrismaQueryCondition,
  ): Promise<ListEmployeesResult> {
    const { page, pageSize, skip, take } = resolvePagination(filter, {
      defaultPageSize: 10,
    });

    // 1. 若指定了角色筛选，提前在 Control DB 获取匹配该角色的租户 memberId
    let roleMemberIds: string[] | undefined;
    if (filter.role && filter.role.trim().length > 0) {
      const members = await controlPrisma.member.findMany({
        where: {
          organizationId: orgId,
          role: { contains: filter.role.trim() },
        },
        select: { id: true },
      });
      roleMemberIds = members.map((m) => m.id);
      if (roleMemberIds.length === 0) {
        return { items: [], total: 0, page, pageSize };
      }
    }

    // 2. 处理部门层级过滤 (若包含子部门，递归提取全部子孙部门 ID)
    let departmentFilter: { in: string[] } | string | undefined;
    if (filter.departmentId) {
      if (filter.includeChildren) {
        const allDepts = await tenantPrisma.department.findMany({
          select: { id: true, parentId: true },
        });
        const treeIds = this.collectDepartmentTreeIds(
          allDepts,
          filter.departmentId,
        );
        departmentFilter = { in: treeIds };
      } else {
        departmentFilter = filter.departmentId;
      }
    }

    // 3. 构造 Tenant DB 强类型档案查询条件
    const where: TenantPrisma.EmployeeProfileWhereInput = {};

    if (departmentFilter) {
      where.departmentId = departmentFilter;
    }
    if (filter.positionId) {
      where.positionId = filter.positionId;
    }
    if (filter.status) {
      where.status = filter.status;
    }
    if (roleMemberIds) {
      where.memberId = { in: roleMemberIds };
    }
    if (filter.search && filter.search.trim().length > 0) {
      const s = filter.search.trim();
      where.OR = [
        { name: { contains: s, mode: "insensitive" } },
        { email: { contains: s, mode: "insensitive" } },
        { phone: { contains: s, mode: "insensitive" } },
        { employeeNo: { contains: s, mode: "insensitive" } },
      ];
    }

    if (accessibleWhere && Object.keys(accessibleWhere).length > 0) {
      where.AND = [
        ...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []),
        accessibleWhere as TenantPrisma.EmployeeProfileWhereInput,
      ];
    }

    // 4. 并发统计总数与分页查取当前页档案
    const [total, profiles] = await Promise.all([
      tenantPrisma.employeeProfile.count({ where }),
      tenantPrisma.employeeProfile.findMany({
        where,
        include: {
          department: {
            select: { id: true, name: true },
          },
          position: {
            select: { id: true, name: true },
          },
          manager: {
            select: { id: true, name: true },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        skip,
        take,
      }),
    ]);

    if (profiles.length === 0) {
      return { items: [], total, page, pageSize };
    }

    // 5. 批量查询关联的 member 角色与全局 User 信息
    const memberIds = profiles
      .map((p) => p.memberId)
      .filter((id): id is string => Boolean(id));

    const memberMap = new Map<
      string,
      {
        roles: string[];
        email?: string;
        name?: string;
        userId?: string;
      }
    >();

    if (memberIds.length > 0) {
      const members = await controlPrisma.member.findMany({
        where: {
          organizationId: orgId,
          id: { in: memberIds },
        },
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      });

      for (const m of members) {
        const roles = m.role
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean);
        memberMap.set(m.id, {
          roles,
          email: m.user?.email ?? undefined,
          name: m.user?.name,
          userId: m.userId,
        });
      }
    }

    // 6. 组装最终展示项
    const accounts = await controlPrisma.tenantAccount.findMany({
      where: { organizationId: orgId, memberId: { in: memberIds } },
      select: { memberId: true, account: true },
    });
    const accountByMemberId = new Map(
      accounts.map((a) => [a.memberId ?? "", a.account]),
    );

    const items: EmployeeItem[] = profiles.map((p) => {
      const memberInfo = p.memberId ? memberMap.get(p.memberId) : undefined;
      const roles = memberInfo?.roles ?? [];

      return {
        id: p.id,
        memberId: p.memberId,
        userId: p.userId ?? memberInfo?.userId ?? null,
        employeeNo: p.employeeNo,
        name: memberInfo?.name || p.name || "未命名员工",
        loginAccount: accountByMemberId.get(p.memberId ?? "") || "",
        email: p.email || "",
        phone: p.phone || "",
        departmentId: p.departmentId,
        departmentName: p.department?.name ?? null,
        positionId: p.positionId,
        positionName: p.position?.name ?? null,
        managerEmployeeId: p.managerEmployeeId,
        managerName: p.manager?.name ?? null,
        jobTitle: p.jobTitle,
        avatarUrl: p.avatarUrl ?? null,
        roles,
        status: p.status,
        joinedAt: p.joinedAt,
        createdAt: p.createdAt,
      };
    });

    return { items, total, page, pageSize };
  }

  /**
   * 多维条件联合查询员工档案列表
   */
  async listEmployees(
    tenantPrisma: TenantPrismaClient,
    controlPrisma: ControlPrismaClient,
    orgId: string,
    filter?: EmployeeListFilter,
  ): Promise<readonly EmployeeItem[]> {
    // 1. 处理部门层级过滤 (若包含子部门，递归提取全部子孙部门 ID)
    let departmentFilter: { in: string[] } | string | undefined;
    if (filter?.departmentId) {
      if (filter.includeChildren) {
        const allDepts = await tenantPrisma.department.findMany({
          select: { id: true, parentId: true },
        });
        const treeIds = this.collectDepartmentTreeIds(
          allDepts,
          filter.departmentId,
        );
        departmentFilter = { in: treeIds };
      } else {
        departmentFilter = filter.departmentId;
      }
    }

    // 2. 构造 Tenant DB 档案查询条件
    const whereCondition: {
      departmentId?: { in: string[] } | string;
      positionId?: string;
      status?: string;
      OR?: Array<{
        name?: { contains: string; mode: "insensitive" };
        email?: { contains: string; mode: "insensitive" };
        phone?: { contains: string; mode: "insensitive" };
        employeeNo?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    if (departmentFilter) {
      whereCondition.departmentId = departmentFilter;
    }
    if (filter?.positionId) {
      whereCondition.positionId = filter.positionId;
    }
    if (filter?.status) {
      whereCondition.status = filter.status;
    }
    if (filter?.search) {
      const s = filter.search.trim();
      if (s) {
        whereCondition.OR = [
          { name: { contains: s, mode: "insensitive" } },
          { email: { contains: s, mode: "insensitive" } },
          { phone: { contains: s, mode: "insensitive" } },
          { employeeNo: { contains: s, mode: "insensitive" } },
        ];
      }
    }

    const profiles = await tenantPrisma.employeeProfile.findMany({
      where: whereCondition,
      include: {
        department: {
          select: { id: true, name: true },
        },
        position: {
          select: { id: true, name: true },
        },
        manager: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    if (profiles.length === 0) {
      return [];
    }

    // 3. 提取所有关联的 memberId，批量到 Control DB 查询 User 与 Member 角色
    const memberIds = profiles
      .map((p) => p.memberId)
      .filter((id): id is string => Boolean(id));

    const memberMap = new Map<
      string,
      {
        roles: string[];
        email?: string;
        name?: string;
        userId?: string;
      }
    >();

    if (memberIds.length > 0) {
      const members = await controlPrisma.member.findMany({
        where: {
          organizationId: orgId,
          id: { in: memberIds },
        },
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      });

      for (const m of members) {
        const roles = m.role
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean);
        memberMap.set(m.id, {
          roles,
          email: m.user?.email ?? undefined,
          name: m.user?.name,
          userId: m.userId,
        });
      }
    }

    // 4. 组装最终展示项并支持角色过滤
    const results: EmployeeItem[] = [];

    const accounts = await controlPrisma.tenantAccount.findMany({
      where: { organizationId: orgId, memberId: { in: memberIds } },
      select: { memberId: true, account: true },
    });
    const accountByMemberId = new Map(
      accounts.map((a) => [a.memberId ?? "", a.account]),
    );

    for (const p of profiles) {
      const memberInfo = p.memberId ? memberMap.get(p.memberId) : undefined;
      const roles = memberInfo?.roles ?? [];

      // 若指定了角色筛选，不匹配则跳过
      if (filter?.role && !roles.includes(filter.role)) {
        continue;
      }

      results.push({
        id: p.id,
        memberId: p.memberId,
        userId: p.userId ?? memberInfo?.userId ?? null,
        employeeNo: p.employeeNo,
        name: memberInfo?.name || p.name || "未命名员工",
        loginAccount: accountByMemberId.get(p.memberId ?? "") || "",
        email: p.email || "",
        phone: p.phone || "",
        departmentId: p.departmentId,
        departmentName: p.department?.name ?? null,
        positionId: p.positionId,
        positionName: p.position?.name ?? null,
        managerEmployeeId: p.managerEmployeeId,
        managerName: p.manager?.name ?? null,
        jobTitle: p.jobTitle,
        avatarUrl: p.avatarUrl ?? null,
        roles,
        status: p.status,
        joinedAt: p.joinedAt,
        createdAt: p.createdAt,
      });
    }

    return results;
  }

  /**
   * 直接录入建号模式：原子在 Control DB 建立/关联 User、Member，在 Tenant DB 创建在职 EmployeeProfile
   */
  async directCreateEmployee(
    tenantPrisma: TenantPrismaClient,
    controlPrisma: ControlPrismaClient,
    orgId: string,
    input: DirectCreateEmployeeInput,
  ): Promise<EmployeeItem> {
    const cleanName = input.name.trim();
    const cleanLoginAccount = input.loginAccount.trim();
    const cleanEmployeeNo = input.employeeNo?.trim() || null;
    const cleanPhone = input.phone?.trim() || null;
    const cleanEmail = input.email?.trim().toLowerCase() || null;

    if (!cleanName) {
      throw new Error("员工姓名不能为空");
    }
    if (!cleanLoginAccount) {
      throw new Error("登录账号不能为空");
    }
    if (!input.initialRoleCodes || input.initialRoleCodes.length === 0) {
      throw new Error("必须为新员工至少指定一个初始系统角色");
    }

    // 1. 校验登录账号租户内唯一
    const existingAccount = await controlPrisma.tenantAccount.findUnique({
      where: {
        organizationId_account: {
          organizationId: orgId,
          account: cleanLoginAccount,
        },
      },
    });
    if (existingAccount) {
      throw new Error(`登录账号 [${cleanLoginAccount}] 已被占用，请更换`);
    }

    // 2. 校验工号唯一性
    if (cleanEmployeeNo) {
      const existingNo = await tenantPrisma.employeeProfile.findUnique({
        where: { employeeNo: cleanEmployeeNo },
      });
      if (existingNo) {
        throw new Error(`工号 [${cleanEmployeeNo}] 已被占用，请更换`);
      }
    }

    // 3. 校验部门、岗位与上级是否存在
    if (input.departmentId) {
      const dept = await tenantPrisma.department.findUnique({
        where: { id: input.departmentId },
      });
      if (!dept) {
        throw new Error("所选部门不存在");
      }
    }

    if (input.positionId) {
      const pos = await tenantPrisma.position.findUnique({
        where: { id: input.positionId },
      });
      if (!pos) {
        throw new Error("所选岗位不存在");
      }
    }

    if (input.managerEmployeeId) {
      const manager = await tenantPrisma.employeeProfile.findUnique({
        where: { id: input.managerEmployeeId },
      });
      if (!manager) {
        throw new Error("所选直属主管不存在");
      }
    }

    const org = await controlPrisma.organization.findUnique({
      where: { id: orgId },
      select: { slug: true },
    });
    if (!org) {
      throw new Error("当前企业不存在");
    }

    // 4. User 会话载体：统一使用带企业 Slug 命名空间的合法唯一 username
    //    形如 `${orgSlug}:${cleanLoginAccount}`，彻底消除伪邮箱
    const namespacedUsername = `${org.slug}:${cleanLoginAccount}`;
    let targetUser = await controlPrisma.user.findUnique({
      where: { username: namespacedUsername },
    });

    const plainPassword = input.password?.trim() || "Admin123456!";
    if (plainPassword.length < 8) {
      throw new Error("初始密码长度至少为 8 位");
    }
    const hashedPassword = await hashPassword(plainPassword);

    if (targetUser) {
      const existingMember = await controlPrisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: orgId,
            userId: targetUser.id,
          },
        },
      });

      if (existingMember) {
        throw new Error(
          `登录账号 [${cleanLoginAccount}] 的用户已属于当前企业，请直接在列表中编辑`,
        );
      }
    } else {
      targetUser = await controlPrisma.user.create({
        data: {
          id: generateUuidV7(),
          username: namespacedUsername,
          name: cleanName,
          email: null,
          emailVerified: false,
        },
      });
    }

    // 5. 在 Control DB 中创建当前租户的 Member 记录
    const memberId = generateUuidV7();
    const roleString = input.initialRoleCodes.join(",");

    const createdMember = await controlPrisma.member.create({
      data: {
        id: memberId,
        organizationId: orgId,
        userId: targetUser.id,
        role: roleString,
      },
    });

    // 6. 独立凭据 TenantAccount：严格使用显式登录账号，禁止后端择优降级
    await controlPrisma.tenantAccount.create({
      data: {
        id: generateUuidV7(),
        organizationId: orgId,
        account: cleanLoginAccount,
        password: hashedPassword,
        name: cleanName,
        memberId: createdMember.id,
        status: "ACTIVE",
      },
    });

    // 7. 在 Tenant DB 中创建在职 EmployeeProfile (直接 ACTIVE 态)
    const profile = await tenantPrisma.employeeProfile.create({
      data: {
        memberId: createdMember.id,
        userId: targetUser.id,
        employeeNo: cleanEmployeeNo,
        departmentId: input.departmentId ?? null,
        positionId: input.positionId ?? null,
        managerEmployeeId: input.managerEmployeeId ?? null,
        name: cleanName,
        email: cleanEmail ?? "",
        phone: cleanPhone ?? "",
        jobTitle: input.jobTitle?.trim() || null,
        avatarUrl: input.avatarUrl?.trim() || null,
        status: "ACTIVE",
        joinedAt: new Date(),
      },
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
      },
    });

    // 8. 租户权限版本自增 (authorizationVersion++)，驱动权限即时失效重构
    await controlPrisma.organization.update({
      where: { id: orgId },
      data: { authorizationVersion: { increment: 1 } },
    });

    return {
      id: profile.id,
      memberId: profile.memberId,
      userId: profile.userId,
      employeeNo: profile.employeeNo,
      name: cleanName,
      loginAccount: cleanLoginAccount,
      email: cleanEmail ?? "",
      phone: cleanPhone ?? "",
      departmentId: profile.departmentId,
      departmentName: profile.department?.name ?? null,
      positionId: profile.positionId,
      positionName: profile.position?.name ?? null,
      managerEmployeeId: profile.managerEmployeeId,
      managerName: profile.manager?.name ?? null,
      jobTitle: profile.jobTitle,
      avatarUrl: profile.avatarUrl ?? null,
      roles: input.initialRoleCodes,
      status: profile.status,
      joinedAt: profile.joinedAt,
      createdAt: profile.createdAt,
    };
  }

  /**
   * 调换部门 (触发 authorizationVersion++ 动态重算 CASL 数据范围)
   */
  async updateEmployee(
    tenantPrisma: TenantPrismaClient,
    controlPrisma: ControlPrismaClient,
    orgId: string,
    employeeId: string,
    input: {
      name?: string;
      loginAccount?: string;
      employeeNo?: string | null;
      phone?: string | null;
      email?: string | null;
      departmentId?: string | null;
      positionId?: string | null;
      jobTitle?: string | null;
      avatarUrl?: string | null;
      roles?: readonly string[];
    },
  ): Promise<EmployeeItem> {
    const profile = await tenantPrisma.employeeProfile.findUnique({
      where: { id: employeeId },
    });
    if (!profile) {
      throw new Error("目标员工档案不存在");
    }

    let shouldIncrementAuthVersion = false;

    // 1. 部门校验
    let targetDeptId = profile.departmentId;
    if (input.departmentId !== undefined) {
      targetDeptId = input.departmentId;
      if (targetDeptId && targetDeptId !== profile.departmentId) {
        const dept = await tenantPrisma.department.findUnique({
          where: { id: targetDeptId },
        });
        if (!dept) throw new Error("目标部门不存在");
      }
      if (targetDeptId !== profile.departmentId) {
        shouldIncrementAuthVersion = true;
      }
    }

    // 2. 岗位校验
    let targetPosId = profile.positionId;
    if (input.positionId !== undefined) {
      targetPosId = input.positionId;
      if (targetPosId && targetPosId !== profile.positionId) {
        const pos = await tenantPrisma.position.findUnique({
          where: { id: targetPosId },
        });
        if (!pos) throw new Error("目标岗位不存在");
      }
    }

    // 3. 更新 Tenant DB 员工档案
    const cleanName = input.name?.trim() || profile.name;
    const cleanEmployeeNo =
      input.employeeNo !== undefined
        ? input.employeeNo?.trim() || null
        : profile.employeeNo;
    const cleanPhone =
      input.phone !== undefined ? input.phone?.trim() || null : null;
    const cleanEmail =
      input.email !== undefined
        ? input.email?.trim().toLowerCase() || null
        : null;

    const updatedProfile = await tenantPrisma.employeeProfile.update({
      where: { id: employeeId },
      data: {
        name: cleanName,
        employeeNo: cleanEmployeeNo,
        ...(input.phone !== undefined
          ? { phone: cleanPhone ?? "" }
          : {}),
        ...(input.email !== undefined
          ? { email: cleanEmail ?? "" }
          : {}),
        department: targetDeptId
          ? { connect: { id: targetDeptId } }
          : { disconnect: true },
        position: targetPosId
          ? { connect: { id: targetPosId } }
          : { disconnect: true },
        jobTitle:
          input.jobTitle !== undefined
            ? input.jobTitle?.trim() || null
            : profile.jobTitle,
        avatarUrl:
          input.avatarUrl !== undefined
            ? input.avatarUrl?.trim() || null
            : profile.avatarUrl,
      },
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
      },
    });

    // 4. 同步 Control DB：登录账号（显式改名）+ 姓名
    let loginAccount = "";
    if (profile.memberId) {
      const tenantAccount = await controlPrisma.tenantAccount.findFirst({
        where: { memberId: profile.memberId, organizationId: orgId },
      });
      const cleanLoginAccount = input.loginAccount?.trim();
      if (cleanLoginAccount) {
        if (tenantAccount && tenantAccount.account !== cleanLoginAccount) {
          const conflict = await controlPrisma.tenantAccount.findUnique({
            where: {
              organizationId_account: {
                organizationId: orgId,
                account: cleanLoginAccount,
              },
            },
          });
          if (conflict) {
            throw new Error(
              `登录账号 [${cleanLoginAccount}] 已被占用，请更换`,
            );
          }
          await controlPrisma.tenantAccount.update({
            where: { id: tenantAccount.id },
            data: { account: cleanLoginAccount, name: cleanName },
          });
          loginAccount = cleanLoginAccount;
        } else if (tenantAccount) {
          await controlPrisma.tenantAccount.update({
            where: { id: tenantAccount.id },
            data: { name: cleanName },
          });
          loginAccount = tenantAccount.account;
        } else {
          throw new Error("该员工尚未开通登录账号，无法修改");
        }
      } else if (tenantAccount) {
        await controlPrisma.tenantAccount.update({
          where: { id: tenantAccount.id },
          data: { name: cleanName },
        });
        loginAccount = tenantAccount.account;
      }
    }

    if (input.name && profile.userId) {
      await controlPrisma.user.update({
        where: { id: profile.userId },
        data: { name: cleanName },
      });
    }

    // 5. 角色同步
    let roles: string[] = [];
    if (profile.memberId) {
      const member = await controlPrisma.member.findUnique({
        where: { id: profile.memberId },
      });
      if (member) {
        roles = member.role
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean);
        if (input.roles && input.roles.length > 0) {
          const newRolesJoined = input.roles.join(",");
          if (newRolesJoined !== member.role) {
            await controlPrisma.member.update({
              where: { id: profile.memberId },
              data: { role: newRolesJoined },
            });
            roles = [...input.roles];
            shouldIncrementAuthVersion = true;
          }
        }
      }
    }

    // 6. 权限版本自增
    if (shouldIncrementAuthVersion) {
      await controlPrisma.organization.update({
        where: { id: orgId },
        data: { authorizationVersion: { increment: 1 } },
      });
    }

    return {
      id: updatedProfile.id,
      memberId: updatedProfile.memberId,
      userId: updatedProfile.userId,
      employeeNo: updatedProfile.employeeNo,
      name: cleanName,
      loginAccount,
      email: updatedProfile.email || "",
      phone: updatedProfile.phone || "",
      departmentId: updatedProfile.departmentId,
      departmentName: updatedProfile.department?.name ?? null,
      positionId: updatedProfile.positionId,
      positionName: updatedProfile.position?.name ?? null,
      managerEmployeeId: updatedProfile.managerEmployeeId,
      managerName: updatedProfile.manager?.name ?? null,
      jobTitle: updatedProfile.jobTitle,
      avatarUrl: updatedProfile.avatarUrl ?? null,
      roles,
      status: updatedProfile.status,
      joinedAt: updatedProfile.joinedAt,
      createdAt: updatedProfile.createdAt,
    };
  }

  /**
   * 调换部门 (触发 authorizationVersion++ 动态重算 CASL 数据范围)
   */
  async transferDepartment(
    tenantPrisma: TenantPrismaClient,
    controlPrisma: ControlPrismaClient,
    orgId: string,
    input: TransferDepartmentInput,
  ): Promise<void> {
    const profile = await tenantPrisma.employeeProfile.findUnique({
      where: { id: input.employeeId },
    });
    if (!profile) {
      throw new Error("目标员工档案不存在");
    }

    if (input.targetDepartmentId) {
      const dept = await tenantPrisma.department.findUnique({
        where: { id: input.targetDepartmentId },
      });
      if (!dept) {
        throw new Error("目标部门不存在");
      }
    }

    await tenantPrisma.employeeProfile.update({
      where: { id: input.employeeId },
      data: {
        department: input.targetDepartmentId
          ? { connect: { id: input.targetDepartmentId } }
          : { disconnect: true },
      },
    });

    // 核心闭环：部门变更立即触发权限版本自增，使 CASL 下推数据范围立即重算
    await controlPrisma.organization.update({
      where: { id: orgId },
      data: { authorizationVersion: { increment: 1 } },
    });
  }

  /**
   * 调换岗位 (遵循 Position != Role，默认不改变系统角色与权限版本)
   */
  async transferPosition(
    tenantPrisma: TenantPrismaClient,
    input: TransferPositionInput,
  ): Promise<void> {
    const profile = await tenantPrisma.employeeProfile.findUnique({
      where: { id: input.employeeId },
    });
    if (!profile) {
      throw new Error("目标员工档案不存在");
    }

    if (input.targetPositionId) {
      const pos = await tenantPrisma.position.findUnique({
        where: { id: input.targetPositionId },
      });
      if (!pos) {
        throw new Error("目标岗位不存在");
      }
    }

    await tenantPrisma.employeeProfile.update({
      where: { id: input.employeeId },
      data: {
        position: input.targetPositionId
          ? { connect: { id: input.targetPositionId } }
          : { disconnect: true },
      },
    });
  }

  /**
   * 调换员工系统角色 (更新 Member 角色并自增 authorizationVersion)
   */
  async transferRoles(
    controlPrisma: ControlPrismaClient,
    orgId: string,
    input: TransferRolesInput,
  ): Promise<void> {
    if (!input.newRoleCodes || input.newRoleCodes.length === 0) {
      throw new Error("员工必须至少保留一个系统角色");
    }

    const member = await controlPrisma.member.findUnique({
      where: { id: input.memberId },
    });
    if (!member || member.organizationId !== orgId) {
      throw new Error("目标租户成员不存在");
    }

    await controlPrisma.member.update({
      where: { id: input.memberId },
      data: { role: input.newRoleCodes.join(",") },
    });

    // 核心闭环：角色变更立即触发权限版本自增，使缓存的 CASL Ability 立即失效
    await controlPrisma.organization.update({
      where: { id: orgId },
      data: { authorizationVersion: { increment: 1 } },
    });
  }

  /**
   * 调整直属领导 (防自环校验)
   */
  async updateManager(
    tenantPrisma: TenantPrismaClient,
    employeeId: string,
    managerEmployeeId: string | null,
  ): Promise<void> {
    if (managerEmployeeId === employeeId) {
      throw new Error("直属主管不能指定为员工本人");
    }

    if (managerEmployeeId) {
      const mgr = await tenantPrisma.employeeProfile.findUnique({
        where: { id: managerEmployeeId },
      });
      if (!mgr) {
        throw new Error("指定的直属主管不存在");
      }
    }

    await tenantPrisma.employeeProfile.update({
      where: { id: employeeId },
      data: { managerEmployeeId },
    });
  }

  /**
   * 停用员工业务访问 (SUSPENDED，触发 authorizationVersion++，严禁封禁全局 User)
   */
  async suspendEmployee(
    tenantPrisma: TenantPrismaClient,
    controlPrisma: ControlPrismaClient,
    orgId: string,
    employeeId: string,
  ): Promise<void> {
    const profile = await tenantPrisma.employeeProfile.findUnique({
      where: { id: employeeId },
    });
    if (!profile) {
      throw new Error("目标员工档案不存在");
    }

    await tenantPrisma.employeeProfile.update({
      where: { id: employeeId },
      data: { status: "SUSPENDED" },
    });

    // 自增 authorizationVersion，驱动 Access Gate 立即拦截
    await controlPrisma.organization.update({
      where: { id: orgId },
      data: { authorizationVersion: { increment: 1 } },
    });
  }

  /**
   * 恢复员工业务访问 (ACTIVE)
   */
  async resumeEmployee(
    tenantPrisma: TenantPrismaClient,
    controlPrisma: ControlPrismaClient,
    orgId: string,
    employeeId: string,
  ): Promise<void> {
    const profile = await tenantPrisma.employeeProfile.findUnique({
      where: { id: employeeId },
    });
    if (!profile) {
      throw new Error("目标员工档案不存在");
    }

    await tenantPrisma.employeeProfile.update({
      where: { id: employeeId },
      data: { status: "ACTIVE" },
    });

    await controlPrisma.organization.update({
      where: { id: orgId },
      data: { authorizationVersion: { increment: 1 } },
    });
  }

  /**
   * 递归展开并收集指定部门及其全部下级子孙部门 ID 集合
   */
  private collectDepartmentTreeIds(
    departments: ReadonlyArray<{ id: string; parentId: string | null }>,
    rootId: string,
  ): string[] {
    const childrenMap = new Map<string, string[]>();
    for (const d of departments) {
      if (d.parentId) {
        const list = childrenMap.get(d.parentId) ?? [];
        list.push(d.id);
        childrenMap.set(d.parentId, list);
      }
    }

    const result: string[] = [];
    const queue = [rootId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);
      result.push(current);

      const children = childrenMap.get(current) ?? [];
      for (const childId of children) {
        if (!visited.has(childId)) {
          queue.push(childId);
        }
      }
    }

    return result;
  }
}
