import { z } from "zod";

// =============================================================================
// CASL 权限主体常量定义 (Single Source of Truth)
// =============================================================================
export const VenueSubject = "Venue" as const;
export const ActivitySubject = "Activity" as const;
export const ActivitySessionSubject = "ActivitySession" as const;
export const AppointmentSubject = "Appointment" as const;
export const VolunteerSubject = "VolunteerApplication" as const;
export const CampusSyncSubject = "CampusSyncRecord" as const;

export type ActivityBookingSubjects =
  | typeof VenueSubject
  | typeof ActivitySubject
  | typeof ActivitySessionSubject
  | typeof AppointmentSubject
  | typeof VolunteerSubject
  | typeof CampusSyncSubject;

// =============================================================================
// Zod 验证契约与 DTO
// =============================================================================

export const CreateVenueSchema = z.object({
  code: z.string().min(1, "场馆编码不能为空").max(50),
  name: z.string().min(1, "场馆名称不能为空").max(100),
  coverUrl: z.string().url("封面地址格式不正确").optional().or(z.literal("")),
  address: z.string().max(255).optional(),
  openTime: z.string().max(100).optional(),
  contactPhone: z.string().max(50).optional(),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
});
export type CreateVenueInput = z.infer<typeof CreateVenueSchema>;

export const CreateActivitySchema = z.object({
  venueId: z.string().uuid("无效的场馆ID"),
  title: z.string().min(1, "活动名称不能为空").max(150),
  coverUrl: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(["GENERAL", "LECTURE", "VOLUNTEER", "INTERNAL"]).default("GENERAL"),
  auditMode: z.enum(["MANUAL", "AUTO"]).default("MANUAL"),
  allowTeam: z.boolean().default(true),
  minTeamSize: z.number().int().min(1).default(5),
  maxTeamSize: z.number().int().max(200).default(50),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  sortOrder: z.number().int().default(0),
});
export type CreateActivityInput = z.infer<typeof CreateActivitySchema>;

export const CreateSessionSchema = z.object({
  activityId: z.string().uuid(),
  spaceId: z.string().uuid().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式如 2026-09-25"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "时间格式如 09:30"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "时间格式如 11:00"),
  totalCapacity: z.number().int().min(1, "容纳名额至少1人").default(50),
  lecturerId: z.string().uuid().optional().nullable(),
});
export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;

export const SubmitAppointmentSchema = z.object({
  activityId: z.string().uuid(),
  sessionId: z.string().uuid(),
  type: z.enum(["INDIVIDUAL", "TEAM", "INTERNAL"]).default("INDIVIDUAL"),
  applicantName: z.string().min(1, "申请人姓名不能为空").max(100),
  phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入合法的11位手机号"),
  idCard: z.string().optional(),
  organization: z.string().max(150).optional(),
  peopleCount: z.number().int().min(1).default(1),
  teamName: z.string().max(150).optional(),
  visitors: z.array(
    z.object({
      name: z.string().min(1, "同行人姓名必填"),
      phone: z.string().optional(),
      idCard: z.string().optional(),
    }),
  ).default([]),
});
export type SubmitAppointmentInput = z.infer<typeof SubmitAppointmentSchema>;

export const AuditAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  action: z.enum(["APPROVE", "REJECT"]),
  remark: z.string().max(255).optional(),
});
export type AuditAppointmentInput = z.infer<typeof AuditAppointmentSchema>;
