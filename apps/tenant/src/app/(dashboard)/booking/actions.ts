import "server-only";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentTenantContext } from "@base/auth";
import { createActivityService } from "@domain/activity-booking/activity-management/server";
import { createVenueService } from "@domain/activity-booking/venue-management/server";
import { submitAppointmentService } from "@domain/activity-booking/appointment-management/server";
import { auditVolunteerService } from "@domain/activity-booking/volunteer-management/server";
import { createNewsService } from "@domain/activity-booking/news-management/server";
import { batchSyncCampusDataService } from "@domain/activity-booking/campus-sync/server";
import { createSessionService } from "@domain/activity-booking/activity-management/server";

export async function createActivityAction(formData: FormData) {
  "use server";
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);

  const venueId = formData.get("venueId") as string;
  const title = (formData.get("title") as string)?.trim();
  const type = (formData.get("type") as "GENERAL" | "LECTURE" | "VOLUNTEER" | "INTERNAL") || "GENERAL";
  const auditMode = (formData.get("auditMode") as "MANUAL" | "AUTO") || "MANUAL";
  const allowTeam = formData.get("allowTeam") === "on";
  const needVolunteer = formData.get("needVolunteer") === "on";
  const volunteerRoles = (formData.get("volunteerRoles") as string)?.trim() || undefined;
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;
  const description = (formData.get("description") as string)?.trim() || undefined;

  if (!venueId || !title || !startDateStr || !endDateStr) {
    throw new Error("请完整填写活动必填项");
  }

  await createActivityService(
    ctx.organizationId,
    {
      venueId,
      title,
      type,
      auditMode,
      allowTeam,
      needVolunteer,
      volunteerRoles,
      startDate: new Date(startDateStr).toISOString(),
      endDate: new Date(endDateStr).toISOString(),
      description,
      minTeamSize: 5,
      maxTeamSize: 50,
      sortOrder: 0,
    },
    "00000000-0000-7000-8000-000000000000",
  );

  revalidatePath("/booking/activities");
  redirect("/booking/activities");
}

export async function createVenueAction(formData: FormData) {
  "use server";
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);

  const code = (formData.get("code") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const address = (formData.get("address") as string)?.trim() || undefined;
  const openTime = (formData.get("openTime") as string)?.trim() || undefined;
  const contactPhone = (formData.get("contactPhone") as string)?.trim() || undefined;
  const description = (formData.get("description") as string)?.trim() || undefined;
  const isDefault = formData.get("isDefault") === "on";

  if (!code || !name) {
    throw new Error("场馆编码与名称必填");
  }

  await createVenueService(
    ctx.organizationId,
    {
      code,
      name,
      address,
      openTime,
      contactPhone,
      description,
      isDefault,
    },
    "00000000-0000-7000-8000-000000000000",
  );

  revalidatePath("/booking/venues");
  redirect("/booking/venues");
}

/**
 * 后台发起“内部免审预约” Action (面向教职工，支持选用已有场次或现场加开临时场次)
 */
export async function createInternalAppointmentAction(formData: FormData) {
  "use server";
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);

  const mode = formData.get("mode") as "EXISTING" | "TEMPORARY";
  const applicantName = (formData.get("applicantName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const organization = (formData.get("organization") as string)?.trim() || "校内教职工专线";
  const peopleCount = Number(formData.get("peopleCount")) || 1;

  if (!applicantName || !phone) {
    throw new Error("请填写预约教师姓名与手机号");
  }

  let finalActivityId = "";
  let finalSessionId = "";

  if (mode === "TEMPORARY") {
    // 现场加开临时场次
    const activityId = formData.get("tempActivityId") as string;
    const tempDate = (formData.get("tempDate") as string)?.trim();
    const tempStartTime = (formData.get("tempStartTime") as string)?.trim();
    const tempEndTime = (formData.get("tempEndTime") as string)?.trim();
    const tempCapacity = Number(formData.get("tempCapacity")) || Math.max(peopleCount, 30);

    if (!activityId || !tempDate || !tempStartTime || !tempEndTime) {
      throw new Error("请完整填写临时场次的日期与时间段");
    }

    const newSession = await createSessionService(
      ctx.organizationId,
      {
        activityId,
        date: tempDate,
        startTime: tempStartTime,
        endTime: tempEndTime,
        totalCapacity: tempCapacity,
        isTemporary: true,
      },
      "00000000-0000-7000-8000-000000000000",
    );

    finalActivityId = activityId;
    finalSessionId = newSession.id;
  } else {
    // 选用已有场次
    const sessionSelect = formData.get("sessionSelect") as string;
    const [actId, sessId] = (sessionSelect || "").split("|");
    if (!actId || !sessId) {
      throw new Error("请选择预约目标活动与场次");
    }
    finalActivityId = actId;
    finalSessionId = sessId;
  }

  await submitAppointmentService(
    ctx.organizationId,
    {
      activityId: finalActivityId,
      sessionId: finalSessionId,
      type: "INTERNAL",
      userType: "TEACHER",
      applicantName,
      phone,
      organization,
      peopleCount,
      visitors: [],
    },
    "00000000-0000-7000-8000-000000000000",
  );

  revalidatePath("/booking/appointments");
  redirect("/booking/appointments");
}

/**
 * 志愿者申请审核 Action (支持录用并调配服务岗位)
 */
export async function auditVolunteerAction(formData: FormData) {
  "use server";
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);

  const applicationId = formData.get("applicationId") as string;
  const action = formData.get("action") as "APPROVE" | "REJECT";
  const serviceRole = (formData.get("serviceRole") as string)?.trim() || undefined;
  const remark = (formData.get("remark") as string)?.trim() || undefined;

  await auditVolunteerService(
    ctx.organizationId,
    { applicationId, action, serviceRole, remark },
    "00000000-0000-7000-8000-000000000000",
  );

  revalidatePath("/booking/volunteers");
}

/**
 * 发布场馆新闻 Action
 */
export async function createNewsAction(formData: FormData) {
  "use server";
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);

  const title = (formData.get("title") as string)?.trim();
  const summary = (formData.get("summary") as string)?.trim() || undefined;
  const content = (formData.get("content") as string)?.trim();
  const author = (formData.get("author") as string)?.trim() || "校史馆办公室";
  const isTop = formData.get("isTop") === "on";

  if (!title || !content) {
    throw new Error("新闻标题与正文必填");
  }

  await createNewsService(
    ctx.organizationId,
    {
      title,
      summary,
      content,
      author,
      isTop,
    },
    "00000000-0000-7000-8000-000000000000",
  );

  revalidatePath("/booking/news");
  redirect("/booking/news");
}

export async function triggerManualSyncAction(type: "TEACHER" | "STUDENT" = "TEACHER") {
  "use server";
  const reqHeaders = await headers();
  const ctx = await getCurrentTenantContext(reqHeaders);

  const mockBatch =
    type === "TEACHER"
      ? [
          {
            type: "TEACHER" as const,
            userCode: `T${Date.now().toString().slice(-6)}`,
            name: "李华 (新同步教师)",
            department: "医学影像与检验学院",
            phone: "13912345678",
            email: "lihua@ningwei.edu.cn",
          },
        ]
      : [
          {
            type: "STUDENT" as const,
            userCode: `S${Date.now().toString().slice(-6)}`,
            name: "张萌 (新同步学生)",
            className: "24检验技术1班",
            phone: "13800003333",
          },
        ];

  await batchSyncCampusDataService(
    ctx.organizationId,
    mockBatch,
    "00000000-0000-7000-8000-000000000000",
  );

  if (type === "TEACHER") {
    revalidatePath("/booking/sync/teachers");
  } else {
    revalidatePath("/booking/sync/students");
  }
}
