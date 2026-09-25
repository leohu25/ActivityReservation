import "server-only";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentTenantContext } from "@base/auth";
import { createSessionService } from "@domain/activity-booking/activity-management/server";

export async function createSessionAction(formData: FormData) {
  "use server";
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);

  const activityId = formData.get("activityId") as string;
  const spaceId = (formData.get("spaceId") as string) || null;
  const date = (formData.get("date") as string)?.trim();
  const startTime = (formData.get("startTime") as string)?.trim();
  const endTime = (formData.get("endTime") as string)?.trim();
  const totalCapacity = Number(formData.get("totalCapacity")) || 30;

  if (!activityId || !date || !startTime || !endTime) {
    throw new Error("请完整填写场次必填项");
  }

  await createSessionService(
    ctx.organizationId,
    {
      activityId,
      spaceId,
      date,
      startTime,
      endTime,
      totalCapacity,
    },
    "00000000-0000-7000-8000-000000000000",
  );

  revalidatePath(`/booking/activities/${activityId}/sessions`);
  redirect(`/booking/activities/${activityId}/sessions`);
}
