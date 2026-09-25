"use server";

import { redirect } from "next/navigation";
import { getTenantDbManager } from "@base/db-tenant";
import { getServerAuthRuntime } from "@base/auth";

export async function submitVolunteerAction(formData: FormData) {
  const activityId = formData.get("activityId") as string;
  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const studentNo = (formData.get("studentNo") as string)?.trim() || undefined;
  const major = (formData.get("major") as string)?.trim() || undefined;
  const serviceRole = (formData.get("serviceRole") as string)?.trim() || "展厅讲解志愿者";

  if (!activityId || !name || !phone) {
    throw new Error("请完整填写真实姓名和手机号");
  }

  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient("01a0d2ea-1691-7508-8ad3-bbd232a45b72");

  await prisma.volunteerApplication.create({
    data: {
      activityId,
      name,
      phone,
      studentNo,
      major,
      serviceRole,
      status: "PENDING",
      createdById: "00000000-0000-7000-8000-000000000000",
    },
  });

  redirect("/my-bookings");
}
