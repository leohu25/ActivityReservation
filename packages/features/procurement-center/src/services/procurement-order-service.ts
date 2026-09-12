import type { AnyMongoAbility } from "@casl/ability";
import type { PrismaAbility } from "@casl/prisma";
import {
  assertEditableFields,
  getAccessibleWhere,
  pickReadableFields,
} from "@base/authorization";
import {
  BusinessError,
  formatCurrency,
  ForbiddenError,
  NotFoundError,
} from "@base/shared";
import type { TenantPrismaClient, TenantPrisma } from "@base/db-tenant";
import {
  type ProcurementField,
  ProcurementOrderStatus,
  ProcurementSubject,
} from "../contracts";
import type {
  AuditOrderInput,
  AuditOrderOperator,
  CreateOrderInput,
  CreateOrderOperator,
  ExportOrderItem,
  ProcurementAnyAbility,
  ProcurementOrderItem,
} from "../types";

/**
 * 采购订单核心业务领域服务 (Procurement Order Service)
 * 职责：
 * 1. 负责采购单的动态权限下推查询与敏感字段脱敏
 * 2. 执行单据新增的可编辑字段白名单安全校验
 * 3. 严格保障【禁止自审】铁律与单向状态机流转 (PENDING -> APPROVED / REJECTED)
 * 4. 提供受字段策略保护的安全导出能力
 */
export class ProcurementOrderService {
  /**
   * 查询采购订单列表，自动依据 CASL 数据范围下推过滤条件，并对敏感成本价格做脱敏处理
   */
  async listOrders(
    prisma: TenantPrismaClient,
    ability: ProcurementAnyAbility,
    currentUserId?: string,
  ): Promise<readonly ProcurementOrderItem[]> {
    // SAFETY: ability 满足 PrismaAbility 运行时契约，提取下推过滤条件
    const accessibleWhere = getAccessibleWhere(
      ability as unknown as PrismaAbility<[string, string]>,
      ProcurementSubject,
      "read",
    );

    // SAFETY: accessibleWhere 经 getAccessibleWhere 归一化为标准的 Prisma 查询条件对象
    const rawOrders = await prisma.purchaseOrder.findMany({
      where: accessibleWhere as unknown as TenantPrisma.PurchaseOrderWhereInput,
      include: {
        department: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const canAuditGlobal = ability.can("audit", ProcurementSubject);

    return rawOrders.map((order) => {
      const isCreator = currentUserId
        ? order.createdById === currentUserId
        : false;
      const isPending = order.status === ProcurementOrderStatus.PENDING;
      const canAuditThisOrder = canAuditGlobal && isPending && !isCreator;
      const isSelfAuditBlocked = canAuditGlobal && isPending && isCreator;

      // SAFETY: ProcurementAnyAbility 均实现 CASL 的字段级 can/rules 运行时契约。
      const readableFields = pickReadableFields(
        ability as unknown as AnyMongoAbility,
        ProcurementSubject,
        {
          orderNo: order.orderNo,
          supplierName: order.supplierName,
          quantity: order.quantity,
          costPrice: formatCurrency(order.costPrice),
          status: order.status as ProcurementOrderStatus,
          auditComment: order.auditComment,
        } satisfies Record<ProcurementField, unknown>,
      );

      return {
        id: order.id,
        ...readableFields,
        deptId: order.deptId,
        departmentName: order.deptId,
        createdById: order.createdById,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        canAuditThisOrder,
        isSelfAuditBlocked,
      };
    });
  }

  /**
   * 创建新采购订单，强制执行功能权限校验与字段可编辑性拦截
   */
  async createOrder(
    prisma: TenantPrismaClient,
    ability: ProcurementAnyAbility,
    operator: CreateOrderOperator,
    input: CreateOrderInput,
  ): Promise<ProcurementOrderItem> {
    if (!ability.can("create", ProcurementSubject)) {
      throw new ForbiddenError("权限拒绝：您不具备新建采购订单的权限");
    }

    // SAFETY: ability 满足 AnyMongoAbility 运行时契约，供 assertEditableFields 进行字段权限校验
    assertEditableFields(
      ability as unknown as AnyMongoAbility,
      ProcurementSubject,
      {
        supplierName: input.supplierName,
        quantity: input.quantity,
        costPrice: input.costPrice,
      },
    );

    const cleanSupplier = input.supplierName?.trim();
    if (!cleanSupplier) {
      throw new BusinessError("供应商名称不能为空");
    }

    const qty = Math.floor(Number(input.quantity));
    if (isNaN(qty) || qty <= 0) {
      throw new BusinessError("采购数量必须为大于 0 的有效正整数");
    }

    const price = Number(input.costPrice);
    if (isNaN(price) || price < 0) {
      throw new BusinessError("采购成本单价必须为有效非负金额");
    }

    if (!operator.departmentId) {
      throw new BusinessError("当前操作员未分配所属部门，无法提交部门采购订单");
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const orderNo = `PO-${dateStr}-${randSuffix}`;

    const created = await prisma.purchaseOrder.create({
      data: {
        orderNo,
        supplierName: cleanSupplier,
        quantity: qty,
        costPrice: price,
        deptId: operator.departmentId,
        createdById: operator.userId,
        status: ProcurementOrderStatus.PENDING,
      },
      include: {
        department: {
          select: { id: true },
        },
      },
    });

    // SAFETY: ProcurementAnyAbility 均实现 CASL 的字段级 can/rules 运行时契约。
    const readableFields = pickReadableFields(
      ability as unknown as AnyMongoAbility,
      ProcurementSubject,
      {
        orderNo: created.orderNo,
        supplierName: created.supplierName,
        quantity: created.quantity,
        costPrice: formatCurrency(created.costPrice),
        status: ProcurementOrderStatus.PENDING,
        auditComment: null,
      } satisfies Record<ProcurementField, unknown>,
    );

    return {
      id: created.id,
      ...readableFields,
      deptId: created.deptId,
      departmentName: created.deptId,
      createdById: created.createdById,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      canAuditThisOrder: false,
      isSelfAuditBlocked: true,
    };
  }

  /**
   * 审核采购订单，严格执行状态机流转与【禁止自审】安全红线
   */
  async auditOrder(
    prisma: TenantPrismaClient,
    ability: ProcurementAnyAbility,
    operator: AuditOrderOperator,
    input: AuditOrderInput,
  ): Promise<ProcurementOrderItem> {
    if (!ability.can("audit", ProcurementSubject)) {
      throw new ForbiddenError("权限拒绝：您不具备采购订单的审核权限");
    }

    const order = await prisma.purchaseOrder.findUnique({
      where: { id: input.orderId },
      include: {
        department: {
          select: { id: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundError(`目标采购订单不存在: ${input.orderId}`);
    }

    // 严格保障【禁止自审】铁律
    if (order.createdById === operator.userId) {
      throw new BusinessError(
        "业务安全红线：严禁采购人员审核自己创建的订单 (禁止自审)",
      );
    }

    // 状态流转单向保护：仅待审核态允许流转为 APPROVED 或 REJECTED
    if (order.status !== ProcurementOrderStatus.PENDING) {
      throw new BusinessError(
        `单据流转错误：当前订单处于 [${order.status}] 状态，已为审核终态，禁止重复处理`,
      );
    }

    if (input.action !== "APPROVE" && input.action !== "REJECT") {
      throw new BusinessError(`不支持的审核操作类型: ${input.action}`);
    }

    const newStatus =
      input.action === "APPROVE"
        ? ProcurementOrderStatus.APPROVED
        : ProcurementOrderStatus.REJECTED;
    const updated = await prisma.purchaseOrder.update({
      where: { id: input.orderId },
      data: {
        status: newStatus,
        auditComment: input.auditComment?.trim() || null,
      },
      include: {
        department: {
          select: { id: true },
        },
      },
    });

    // SAFETY: ProcurementAnyAbility 均实现 CASL 的字段级 can/rules 运行时契约。
    const readableFields = pickReadableFields(
      ability as unknown as AnyMongoAbility,
      ProcurementSubject,
      {
        orderNo: updated.orderNo,
        supplierName: updated.supplierName,
        quantity: updated.quantity,
        costPrice: formatCurrency(updated.costPrice),
        status: newStatus,
        auditComment: updated.auditComment,
      } satisfies Record<ProcurementField, unknown>,
    );

    return {
      id: updated.id,
      ...readableFields,
      deptId: updated.deptId,
      departmentName: updated.deptId,
      createdById: updated.createdById,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      canAuditThisOrder: false,
      isSelfAuditBlocked: false,
    };
  }

  /**
   * 导出采购订单数据，遵循字段策略过滤隐藏字段
   */
  async exportOrders(
    prisma: TenantPrismaClient,
    ability: ProcurementAnyAbility,
  ): Promise<readonly ExportOrderItem[]> {
    if (!ability.can("export", ProcurementSubject)) {
      throw new ForbiddenError("权限拒绝：您不具备导出采购订单的权限");
    }

    // SAFETY: ability 满足 PrismaAbility 运行时契约，提取导出操作的数据下推过滤条件
    const accessibleWhere = getAccessibleWhere(
      ability as unknown as PrismaAbility<[string, string]>,
      ProcurementSubject,
      "read",
    );

    // SAFETY: accessibleWhere 经 getAccessibleWhere 归一化为标准的 Prisma 查询条件对象
    const orders = await prisma.purchaseOrder.findMany({
      where: accessibleWhere as unknown as TenantPrisma.PurchaseOrderWhereInput,
      orderBy: { createdAt: "desc" },
    });

    const canExportCostPrice =
      ability.can("export", ProcurementSubject, "costPrice") ||
      ability.can("read", ProcurementSubject, "costPrice");

    return orders.map((order) => ({
      orderNo: order.orderNo,
      supplierName: order.supplierName,
      quantity: order.quantity,
      costPrice: canExportCostPrice ? order.costPrice.toString() : undefined,
      status: order.status,
      deptId: order.deptId,
      createdById: order.createdById,
      createdAt: order.createdAt.toISOString(),
    }));
  }
}
