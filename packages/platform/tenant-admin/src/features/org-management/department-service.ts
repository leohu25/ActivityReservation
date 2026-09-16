import type { TenantPrismaClient } from "@base/db-tenant";
import {
  buildTree,
  BusinessError,
  ConflictError,
  NotFoundError,
} from "@base/shared";
import type {
  CreateDepartmentInput,
  DepartmentTreeNode,
  UpdateDepartmentInput,
} from "./types";

/**
 * 部门管理领域服务 (Department Service)
 * 职责：
 * 1. 递归构建与检索租户内部树状部门架构，统计各节点在职员工人数与负责人；
 * 2. 负责部门的新建与更新，执行严格防环算法拦截自环或后代循环引用；
 * 3. 严格遵循 Fail-Closed 保护机制，部门下存在子部门或在职员工时禁止物理删除。
 */
export class DepartmentService {
  /**
   * 递归检索全量部门树形结构（包含在职员工计数与部门负责人快照）
   */
  async listDepartmentTree(
    tenantPrisma: TenantPrismaClient,
  ): Promise<readonly DepartmentTreeNode[]> {
    // 1. 查询全量部门数据
    const allDepts = await tenantPrisma.department.findMany({
      orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
    });

    if (allDepts.length === 0) {
      return [];
    }

    // 2. 统计各部门在职员工人数 (status 为 ACTIVE)
    const employeeCounts = await tenantPrisma.employeeProfile.groupBy({
      by: ["departmentId"],
      where: {
        status: "ACTIVE",
        departmentId: { not: null },
      },
      _count: {
        _all: true,
      },
    });

    const countMap = new Map<string, number>();
    for (const ec of employeeCounts) {
      if (ec.departmentId) {
        countMap.set(ec.departmentId, ec._count._all);
      }
    }

    // 3. 提取负责人 Member ID 并解析对应的姓名快照
    const leaderMemberIds = allDepts
      .map((d) => d.leaderMemberId)
      .filter((id): id is string => Boolean(id));

    const leaderMap = new Map<string, string>();
    if (leaderMemberIds.length > 0) {
      const leaders = await tenantPrisma.employeeProfile.findMany({
        where: {
          memberId: { in: leaderMemberIds },
        },
        select: {
          memberId: true,
          nameSnapshot: true,
        },
      });
      for (const leader of leaders) {
        if (leader.memberId) {
          leaderMap.set(leader.memberId, leader.nameSnapshot);
        }
      }
    }

    // 4. 将扁平部门数据预装配为带统计信息的节点列表，并复用 @base/shared 的 buildTree 统一构建树
    const departmentNodes = allDepts.map((raw) => ({
      id: raw.id,
      name: raw.name,
      code: raw.code,
      parentId: raw.parentId,
      leaderMemberId: raw.leaderMemberId,
      leaderName: raw.leaderMemberId
        ? (leaderMap.get(raw.leaderMemberId) ?? null)
        : null,
      sort: raw.sort,
      status: raw.status,
      employeeCount: countMap.get(raw.id) ?? 0,
      createdAt: raw.createdAt,
    }));

    return buildTree(departmentNodes);
  }

  /**
   * 创建新部门节点
   */
  async createDepartment(
    tenantPrisma: TenantPrismaClient,
    input: CreateDepartmentInput,
  ): Promise<DepartmentTreeNode> {
    const cleanName = input.name.trim();
    const cleanCode = input.code.trim();

    if (!cleanName) {
      throw new BusinessError("部门名称不能为空");
    }
    if (!cleanCode) {
      throw new BusinessError("部门编码不能为空");
    }

    // 检查编码唯一性
    const existing = await tenantPrisma.department.findUnique({
      where: { code: cleanCode },
    });
    if (existing) {
      throw new ConflictError(`部门编码 [${cleanCode}] 已存在，请更换`);
    }

    // 若指定了上级部门，检查上级是否存在
    if (input.parentId) {
      const parent = await tenantPrisma.department.findUnique({
        where: { id: input.parentId },
      });
      if (!parent) {
        throw new NotFoundError(`指定的上级部门不存在`);
      }
    }

    const newId = `dept_${cleanCode.toLowerCase().replace(/[^a-z0-9_]/g, "_")}_${Date.now()}`;
    const created = await tenantPrisma.department.create({
      data: {
        id: newId,
        name: cleanName,
        code: cleanCode,
        parentId: input.parentId ?? null,
        leaderMemberId: input.leaderMemberId ?? null,
        sort: input.sort ?? 0,
        status: "ACTIVE",
      },
    });

    return {
      id: created.id,
      name: created.name,
      code: created.code,
      parentId: created.parentId,
      leaderMemberId: created.leaderMemberId,
      leaderName: null,
      sort: created.sort,
      status: created.status,
      employeeCount: 0,
      children: [],
      createdAt: created.createdAt,
    };
  }

  /**
   * 编辑部门信息（含防环检测）
   */
  async updateDepartment(
    tenantPrisma: TenantPrismaClient,
    id: string,
    input: UpdateDepartmentInput,
  ): Promise<DepartmentTreeNode> {
    const existing = await tenantPrisma.department.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new Error(`目标部门不存在`);
    }

    const cleanName = input.name === undefined ? undefined : input.name.trim();
    const cleanCode = input.code === undefined ? undefined : input.code.trim();

    if (cleanName !== undefined && !cleanName) {
      throw new Error("部门名称不能为空");
    }
    if (cleanCode !== undefined && !cleanCode) {
      throw new Error("部门编码不能为空");
    }

    // 检查编码唯一性
    if (cleanCode && cleanCode !== existing.code) {
      const duplicateCode = await tenantPrisma.department.findUnique({
        where: { code: cleanCode },
      });
      if (duplicateCode) {
        throw new Error(`部门编码 [${cleanCode}] 已存在，请更换`);
      }
    }

    // 防环算法：若修改了上级部门 parentId，严格检查不可将上级设置为其自身或其子孙后代
    if (input.parentId !== undefined && input.parentId !== existing.parentId) {
      if (input.parentId === id) {
        throw new Error("无法将部门的上级设置为其自身");
      }

      if (input.parentId !== null) {
        const parent = await tenantPrisma.department.findUnique({
          where: { id: input.parentId },
        });
        if (!parent) {
          throw new Error("指定的上级部门不存在");
        }

        // 收集当前部门的所有子孙部门 ID
        const allDepts = await tenantPrisma.department.findMany({
          select: { id: true, parentId: true },
        });

        const descendants = this.collectDescendantIds(allDepts, id);
        if (descendants.has(input.parentId)) {
          throw new Error("无法将部门的上级设置为其子孙部门（存在循环依赖）");
        }
      }
    }

    const updated = await tenantPrisma.department.update({
      where: { id },
      data: {
        name: cleanName,
        code: cleanCode,
        parentId: input.parentId,
        leaderMemberId: input.leaderMemberId,
        sort: input.sort,
        status: input.status,
      },
    });

    let leaderName: string | null = null;
    if (updated.leaderMemberId) {
      const leader = await tenantPrisma.employeeProfile.findUnique({
        where: { memberId: updated.leaderMemberId },
        select: { nameSnapshot: true },
      });
      leaderName = leader?.nameSnapshot ?? null;
    }

    const count = await tenantPrisma.employeeProfile.count({
      where: { departmentId: updated.id, status: "ACTIVE" },
    });

    return {
      id: updated.id,
      name: updated.name,
      code: updated.code,
      parentId: updated.parentId,
      leaderMemberId: updated.leaderMemberId,
      leaderName,
      sort: updated.sort,
      status: updated.status,
      employeeCount: count,
      children: [],
      createdAt: updated.createdAt,
    };
  }

  /**
   * 删除部门（Fail-Closed 防护）
   */
  async deleteDepartment(
    tenantPrisma: TenantPrismaClient,
    id: string,
  ): Promise<void> {
    const existing = await tenantPrisma.department.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new Error(`目标部门不存在`);
    }

    // 1. 检查是否存在子部门
    const childrenCount = await tenantPrisma.department.count({
      where: { parentId: id },
    });
    if (childrenCount > 0) {
      throw new Error("该部门下存在子部门，请先迁移或删除子部门");
    }

    // 2. 检查是否存在未离职员工
    const employeeCount = await tenantPrisma.employeeProfile.count({
      where: {
        departmentId: id,
        status: { not: "TERMINATED" },
      },
    });
    if (employeeCount > 0) {
      throw new Error("该部门下仍有在职员工，请先将员工迁移至其他部门");
    }

    // 3. 检查是否存在关联的历史业务单据 (Fail-Closed 防护)
    // SAFETY: TenantPrisma 处于租户多模型物理聚合数据库中，动态探测业务切片实体是否存在
    const clientWithPo = tenantPrisma as unknown as {
      purchaseOrder?: {
        count: (args: { where: { deptId: string } }) => Promise<number>;
      };
    };
    if (clientWithPo.purchaseOrder) {
      const orderCount = await clientWithPo.purchaseOrder.count({
        where: { deptId: id },
      });
      if (orderCount > 0) {
        throw new Error("该部门已关联历史业务单据，禁止物理删除");
      }
    }

    await tenantPrisma.department.delete({
      where: { id },
    });
  }

  /**
   * 递归收集指定根部门的所有下级子孙部门 ID 集合
   */
  private collectDescendantIds(
    departments: ReadonlyArray<{ id: string; parentId: string | null }>,
    rootId: string,
  ): Set<string> {
    const childrenMap = new Map<string, string[]>();
    for (const d of departments) {
      if (d.parentId) {
        const list = childrenMap.get(d.parentId) ?? [];
        list.push(d.id);
        childrenMap.set(d.parentId, list);
      }
    }

    const descendants = new Set<string>();
    const queue = [rootId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = childrenMap.get(current) ?? [];
      for (const childId of children) {
        if (!descendants.has(childId)) {
          descendants.add(childId);
          queue.push(childId);
        }
      }
    }

    return descendants;
  }
}
