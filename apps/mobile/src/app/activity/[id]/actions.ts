"use server";

import { redirect } from "next/navigation";
import { submitAppointmentService } from "@domain/activity-booking/appointment-management/server";

export async function submitAppointmentAction(formData: FormData) {
  const activityId = formData.get("activityId") as string;
  const sessionId = formData.get("sessionId") as string;
  const applicantName = (formData.get("applicantName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const idCard = (formData.get("idCard") as string)?.trim() || undefined;
  const organization = (formData.get("organization") as string)?.trim() || undefined;
  const type = (formData.get("type") as "INDIVIDUAL" | "TEAM") || "INDIVIDUAL";
  const teamName = (formData.get("teamName") as string)?.trim() || undefined;
  const visitorName = (formData.get("visitorName") as string)?.trim();
  const visitorPhone = (formData.get("visitorPhone") as string)?.trim();

  if (!activityId || !sessionId || !applicantName || !phone) {
    throw new Error("请完整填写必填项");
  }

  const visitors = visitorName
    ? [{ name: visitorName, phone: visitorPhone || undefined, userType: "GENERAL" as const }]
    : [];

  const peopleCount = 1 + visitors.length;

  const orgId = "01a0d2ea-1691-7508-8ad3-bbd232a45b72";
  const dummyUserId = "00000000-0000-7000-8000-000000000000";

  await submitAppointmentService(
    orgId,
    {
      activityId,
      sessionId,
      type,
      userType: "GENERAL",
      applicantName,
      phone,
      idCard,
      organization,
      peopleCount,
      teamName,
      visitors,
    },
    dummyUserId,
  );

  redirect("/my-bookings");
}
