import "server-only";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getCurrentTenantContext } from "@base/auth";
import { getTenantDbManager } from "@base/db-tenant";
import { getServerAuthRuntime } from "@base/auth";

export async function checkinByCodeAction(formData: FormData) {
  "use server";
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);
  const code = (formData.get("code") as string)?.trim();

  if (!code) throw new Error("请输入核销预约单号或通行字串");

  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient(ctx.organizationId);

  const cleanCode = code.startsWith("NW-PASS:") ? code.split(":")[1] : code;

  const appt = await prisma.appointment.findFirst({
    where: { code: cleanCode, isDeleted: false },
  });

  if (!appt) throw new Error("未查到有效预约记录，请核对单号");
  if (appt.status !== "APPROVED") {
    throw new Error(`当前状态为 [${appt.status}]，不可核销入场`);
  }

  await prisma.appointment.update({
    where: { id: appt.id },
    data: {
      status: "CHECKED_IN",
      checkedInAt: new Date(),
    },
  });

  revalidatePath("/booking/qrcodes");
}
