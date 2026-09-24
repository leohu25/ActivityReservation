import "server-only";
import { getTenantDbManager } from "@base/db-tenant";
import { getServerAuthRuntime } from "@base/auth";

export interface SyncRecordInput {
  type: "TEACHER" | "STUDENT";
  userCode: string;
  name: string;
  department?: string;
  className?: string;
  idCard?: string;
  phone?: string;
  email?: string;
}

export async function listCampusSyncRecordsQuery(organizationId: string) {
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient(organizationId);

  return prisma.campusSyncRecord.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * 接收教职工/学生外部同步数据，自动创建/更新系统用户 (Auto-provisioning)
 */
export async function batchSyncCampusDataService(
  organizationId: string,
  records: SyncRecordInput[],
  userId: string,
) {
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient(organizationId);

  let successCount = 0;
  let failCount = 0;

  for (const item of records) {
    try {
      await prisma.$transaction(async (tx) => {
        // 1. 记录同步明细
        const record = await tx.campusSyncRecord.upsert({
          where: {
            type_userCode: {
              type: item.type,
              userCode: item.userCode,
            },
          },
          update: {
            name: item.name,
            department: item.department,
            className: item.className,
            idCard: item.idCard,
            phone: item.phone,
            email: item.email,
            syncStatus: "SYNCED",
            errorMsg: null,
            updatedById: userId,
          },
          create: {
            type: item.type,
            userCode: item.userCode,
            name: item.name,
            department: item.department,
            className: item.className,
            idCard: item.idCard,
            phone: item.phone,
            email: item.email,
            syncStatus: "SYNCED",
            createdById: userId,
          },
        });

        // 2. 若为教职工，则自动在后台 User 体系中自愈创建系统用户
        if (item.type === "TEACHER" && item.phone) {
          // 查找是否已存在同手机号/工号用户
          const existingUser = await tx.user.findFirst({
            where: {
              OR: [{ email: item.email || `${item.userCode}@campus.local` }],
              isDeleted: false,
            },
          });

          if (!existingUser) {
            const newUser = await tx.user.create({
              data: {
                name: item.name,
                email: item.email || `${item.userCode}@campus.local`,
                role: "STAFF",
                createdById: userId,
              },
            });
            await tx.campusSyncRecord.update({
              where: { id: record.id },
              data: { boundUserId: newUser.id },
            });
          }
        }
      });
      successCount++;
    } catch (e: any) {
      failCount++;
      await prisma.campusSyncRecord.upsert({
        where: {
          type_userCode: {
            type: item.type,
            userCode: item.userCode,
          },
        },
        update: {
          syncStatus: "FAILED",
          errorMsg: e?.message || "同步异常",
        },
        create: {
          type: item.type,
          userCode: item.userCode,
          name: item.name,
          syncStatus: "FAILED",
          errorMsg: e?.message || "同步异常",
          createdById: userId,
        },
      });
    }
  }

  return { successCount, failCount, total: records.length };
}
