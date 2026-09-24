import "server-only";
import { getTenantDbManager } from "@base/db-tenant";
import { getServerAuthRuntime } from "@base/auth";
import type { SubmitAppointmentInput, AuditAppointmentInput } from "../contract";

function generateAppointmentCode(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `APPT${dateStr}${rand}`;
}

export async function listAppointmentsQuery(organizationId: string, status?: string) {
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient(organizationId);

  return prisma.appointment.findMany({
    where: {
      isDeleted: false,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      activity: { select: { id: true, title: true } },
      session: true,
      visitors: { where: { isDeleted: false } },
      team: true,
    },
  });
}

/**
 * 提交预约提单（支持事务保证 + 场次名额原子扣减防超卖）
 */
export async function submitAppointmentService(organizationId: string, input: SubmitAppointmentInput, userId: string) {
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient(organizationId);

  return prisma.$transaction(async (tx) => {
    // 1. 原子检查并扣减名额 (确保当前 bookedCount + peopleCount <= totalCapacity)
    const session = await tx.activitySession.findUnique({
      where: { id: input.sessionId, isDeleted: false },
    });
    if (!session) {
      throw new Error("预约场次不存在或已下线");
    }
    if (session.bookedCount + input.peopleCount > session.totalCapacity) {
      throw new Error(`所选场次余量不足！仅剩 ${session.totalCapacity - session.bookedCount} 个名额`);
    }

    // 更新扣减名额
    await tx.activitySession.update({
      where: { id: input.sessionId },
      data: {
        bookedCount: { increment: input.peopleCount },
        status: session.bookedCount + input.peopleCount >= session.totalCapacity ? "FULL" : "ACTIVE",
      },
    });

    const code = generateAppointmentCode();

    // 2. 创建预约单主表
    const appointment = await tx.appointment.create({
      data: {
        code,
        activityId: input.activityId,
        sessionId: input.sessionId,
        type: input.type,
        applicantName: input.applicantName,
        phone: input.phone,
        idCard: input.idCard,
        organization: input.organization,
        peopleCount: input.peopleCount,
        status: "PENDING",
        createdById: userId,
        visitors: {
          create: input.visitors.map((v) => ({
            name: v.name,
            phone: v.phone,
            idCard: v.idCard,
            createdById: userId,
          })),
        },
      },
    });

    // 3. 若为团队预约，创建团队信息
    if (input.type === "TEAM" && input.teamName) {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await tx.appointmentTeam.create({
        data: {
          appointmentId: appointment.id,
          teamName: input.teamName,
          inviteCode,
          leaderName: input.applicantName,
          leaderPhone: input.phone,
          targetCount: input.peopleCount,
          joinedCount: 1 + input.visitors.length,
          createdById: userId,
        },
      });
    }

    return appointment;
  });
}

/**
 * 审批预约单（审核通过 / 驳回，若驳回则原子归还名额）
 */
export async function auditAppointmentService(organizationId: string, input: AuditAppointmentInput, userId: string) {
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient(organizationId);

  return prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUnique({
      where: { id: input.appointmentId, isDeleted: false },
    });
    if (!appointment) throw new Error("预约单不存在");
    if (appointment.status !== "PENDING") throw new Error("该预约单已审核过，无法重复操作");

    if (input.action === "REJECT") {
      // 驳回归还名额
      await tx.activitySession.update({
        where: { id: appointment.sessionId },
        data: {
          bookedCount: { decrement: appointment.peopleCount },
          status: "ACTIVE",
        },
      });
    }

    // 生成入场二维码签名字串
    const qrCodeSign =
      input.action === "APPROVE"
        ? `NW-PASS:${appointment.code}:${Buffer.from(`${appointment.phone}-${Date.now()}`).toString("base64")}`
        : null;

    return tx.appointment.update({
      where: { id: input.appointmentId },
      data: {
        status: input.action === "APPROVE" ? "APPROVED" : "REJECTED",
        auditRemark: input.remark,
        auditedById: userId,
        auditedAt: new Date(),
        qrCodeSign,
      },
    });
  });
}
