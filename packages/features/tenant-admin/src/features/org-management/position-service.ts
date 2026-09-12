import type { TenantPrismaClient } from "@base/db-tenant";
import type {
  CreatePositionInput,
  PositionItem,
  UpdatePositionInput,
} from "./types";

/**
 * 岗位管理领域服务 (Position Service)
 * 职责：
 * 1. 维护企业岗位字典（名称、编码、职责说明、排序、启停状态）；
 * 2. 统计各岗位在职员工人数；
 * 3. 严格遵循 Position != Role 解耦红线，岗位不直接决定系统权限；
 * 4. 具备删除防护：仍有关联在职员工时禁止物理删除。
 */
export class PositionService {
  /**
   * 查询所有岗位列表（包含各岗位的在职员工人数）
   */
  async listPositions(
    tenantPrisma: TenantPrismaClient,
  ): Promise<readonly PositionItem[]> {
    const allPositions = await tenantPrisma.position.findMany({
      orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
    });

    if (allPositions.length === 0) {
      return [];
    }

    // 统计各岗位当前在职员工人数 (status 为 ACTIVE)
    const counts = await tenantPrisma.employeeProfile.groupBy({
      by: ["positionId"],
      where: {
        status: "ACTIVE",
        positionId: { not: null },
      },
      _count: {
        _all: true,
      },
    });

    const countMap = new Map<string, number>();
    for (const item of counts) {
      if (item.positionId) {
        countMap.set(item.positionId, item._count._all);
      }
    }

    return allPositions.map((pos) => ({
      id: pos.id,
      name: pos.name,
      code: pos.code,
      description: pos.description,
      sort: pos.sort,
      status: pos.status,
      employeeCount: countMap.get(pos.id) ?? 0,
      createdAt: pos.createdAt,
    }));
  }

  /**
   * 创建新岗位字典
   */
  async createPosition(
    tenantPrisma: TenantPrismaClient,
    input: CreatePositionInput,
  ): Promise<PositionItem> {
    const cleanName = input.name.trim();
    const cleanCode = input.code.trim();

    if (!cleanName) {
      throw new Error("岗位名称不能为空");
    }
    if (!cleanCode) {
      throw new Error("岗位编码不能为空");
    }

    // 检查编码唯一性
    const existing = await tenantPrisma.position.findUnique({
      where: { code: cleanCode },
    });
    if (existing) {
      throw new Error(`岗位编码 [${cleanCode}] 已存在，请更换`);
    }

    const created = await tenantPrisma.position.create({
      data: {
        name: cleanName,
        code: cleanCode,
        description: input.description?.trim() || null,
        sort: input.sort ?? 0,
        status: "ACTIVE",
      },
    });

    return {
      id: created.id,
      name: created.name,
      code: created.code,
      description: created.description,
      sort: created.sort,
      status: created.status,
      employeeCount: 0,
      createdAt: created.createdAt,
    };
  }

  /**
   * 更新岗位信息
   */
  async updatePosition(
    tenantPrisma: TenantPrismaClient,
    id: string,
    input: UpdatePositionInput,
  ): Promise<PositionItem> {
    const existing = await tenantPrisma.position.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new Error("目标岗位不存在");
    }

    const cleanName = input.name === undefined ? undefined : input.name.trim();
    const cleanCode = input.code === undefined ? undefined : input.code.trim();

    if (cleanName !== undefined && !cleanName) {
      throw new Error("岗位名称不能为空");
    }
    if (cleanCode !== undefined && !cleanCode) {
      throw new Error("岗位编码不能为空");
    }

    if (cleanCode && cleanCode !== existing.code) {
      const duplicate = await tenantPrisma.position.findUnique({
        where: { code: cleanCode },
      });
      if (duplicate) {
        throw new Error(`岗位编码 [${cleanCode}] 已存在，请更换`);
      }
    }

    const updated = await tenantPrisma.position.update({
      where: { id },
      data: {
        name: cleanName,
        code: cleanCode,
        description:
          input.description === undefined
            ? undefined
            : input.description?.trim() || null,
        sort: input.sort,
        status: input.status,
      },
    });

    const count = await tenantPrisma.employeeProfile.count({
      where: { positionId: updated.id, status: "ACTIVE" },
    });

    return {
      id: updated.id,
      name: updated.name,
      code: updated.code,
      description: updated.description,
      sort: updated.sort,
      status: updated.status,
      employeeCount: count,
      createdAt: updated.createdAt,
    };
  }

  /**
   * 切换岗位启用/停用状态
   */
  async togglePositionStatus(
    tenantPrisma: TenantPrismaClient,
    id: string,
  ): Promise<PositionItem> {
    const existing = await tenantPrisma.position.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new Error("目标岗位不存在");
    }

    const nextStatus = existing.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const updated = await tenantPrisma.position.update({
      where: { id },
      data: { status: nextStatus },
    });

    const count = await tenantPrisma.employeeProfile.count({
      where: { positionId: updated.id, status: "ACTIVE" },
    });

    return {
      id: updated.id,
      name: updated.name,
      code: updated.code,
      description: updated.description,
      sort: updated.sort,
      status: updated.status,
      employeeCount: count,
      createdAt: updated.createdAt,
    };
  }

  /**
   * 删除岗位（Fail-Closed 保护：有关联在职员工时禁止删除）
   */
  async deletePosition(
    tenantPrisma: TenantPrismaClient,
    id: string,
  ): Promise<void> {
    const existing = await tenantPrisma.position.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new Error("目标岗位不存在");
    }

    const count = await tenantPrisma.employeeProfile.count({
      where: {
        positionId: id,
        status: { not: "TERMINATED" },
      },
    });

    if (count > 0) {
      throw new Error(
        "该岗位仍有关联在职员工，请先将员工调整至其他岗位后再删除",
      );
    }

    await tenantPrisma.position.delete({
      where: { id },
    });
  }
}
