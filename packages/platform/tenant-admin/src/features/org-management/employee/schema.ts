import { z } from "@base/ui";

/**
 * 直接录入建号创建新员工 Schema (SSoT)
 * 登录账号为一等显式字段；邮箱/工号/手机号仅为人事档案属性。
 */
export const directCreateEmployeeSchema = z.object({
  name: z
    .string()
    .min(1, "员工姓名不能为空")
    .max(50, "员工姓名最多50个字符"),
  loginAccount: z
    .string()
    .min(1, "登录账号不能为空")
    .max(64, "登录账号最多64个字符")
    .regex(
      /^[A-Za-z0-9_@.\-]+$/,
      "登录账号仅支持字母、数字、下划线、中划线、点与 @",
    ),
  employeeNo: z
    .string()
    .max(50, "工号最多50个字符")
    .optional()
    .default(""),
  phone: z
    .string()
    .max(20, "手机号最多20个字符")
    .optional()
    .default(""),
  email: z
    .string()
    .max(120, "邮箱最多120个字符")
    .optional()
    .default("")
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "请输入有效的电子邮箱地址",
    }),
  departmentId: z
    .string()
    .min(1, "请选择归属部门"),
  positionId: z
    .string()
    .optional()
    .nullable()
    .default(null),
  managerEmployeeId: z
    .string()
    .optional()
    .nullable()
    .default(null),
  jobTitle: z
    .string()
    .max(50, "职务职称最多50个字符")
    .optional()
    .default(""),
  avatarUrl: z
    .string()
    .optional()
    .nullable()
    .default(null),
  initialRoleCodes: z
    .array(z.string())
    .min(1, "请至少选择一个初始系统角色"),
  password: z
    .string()
    .min(8, "初始密码至少8位字符")
    .optional()
    .default("Admin123456!"),
});

export type DirectCreateEmployeeSchema = z.infer<
  typeof directCreateEmployeeSchema
>;

/**
 * 编辑更新员工档案 Schema (SSoT)
 * 允许显式修改登录账号；邮箱可选，仅作联系方式。
 */
export const updateEmployeeSchema = z.object({
  name: z
    .string()
    .min(1, "员工姓名不能为空")
    .max(50, "员工姓名最多50个字符"),
  loginAccount: z
    .string()
    .min(1, "登录账号不能为空")
    .max(64, "登录账号最多64个字符")
    .regex(
      /^[A-Za-z0-9_@.\-]+$/,
      "登录账号仅支持字母、数字、下划线、中划线、点与 @",
    ),
  employeeNo: z
    .string()
    .max(50, "工号最多50个字符")
    .optional()
    .default(""),
  phone: z
    .string()
    .max(20, "手机号最多20个字符")
    .optional()
    .default(""),
  email: z
    .string()
    .max(120, "邮箱最多120个字符")
    .optional()
    .default("")
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "请输入有效的电子邮箱地址",
    }),
  departmentId: z
    .string()
    .min(1, "请选择归属部门"),
  positionId: z
    .string()
    .optional()
    .nullable()
    .default(null),
  jobTitle: z
    .string()
    .max(50, "职务职称最多50个字符")
    .optional()
    .default(""),
  avatarUrl: z
    .string()
    .optional()
    .nullable()
    .default(null),
  roles: z
    .array(z.string())
    .min(1, "员工必须至少保留一个业务角色"),
});

export type UpdateEmployeeSchema = z.infer<typeof updateEmployeeSchema>;

/**
 * 调动员工部门 Schema
 */
export const transferDepartmentSchema = z.object({
  employeeId: z.string().min(1, "员工ID不能为空"),
  targetDepartmentId: z.string().nullable(),
});

export type TransferDepartmentSchema = z.infer<
  typeof transferDepartmentSchema
>;

/**
 * 调整员工岗位 Schema
 */
export const transferPositionSchema = z.object({
  employeeId: z.string().min(1, "员工ID不能为空"),
  targetPositionId: z.string().nullable(),
});

export type TransferPositionSchema = z.infer<typeof transferPositionSchema>;

/**
 * 调整员工角色 Schema
 */
export const transferRolesSchema = z.object({
  memberId: z.string().min(1, "租户成员ID不能为空"),
  newRoleCodes: z.array(z.string()).min(1, "员工至少需要保留一个业务角色"),
});

export type TransferRolesSchema = z.infer<typeof transferRolesSchema>;

/** UI 默认建议登录账号：工号 → 手机号（仅预填，落库以最终输入为准） */
export function suggestLoginAccount(input: {
  employeeNo?: string | null;
  phone?: string | null;
}): string {
  const emp = input.employeeNo?.trim() ?? "";
  const phone = input.phone?.trim() ?? "";
  return emp || phone || "";
}

export function parseDirectCreateEmployeeInput(
  input: unknown,
): DirectCreateEmployeeSchema {
  return directCreateEmployeeSchema.parse(input);
}

export function parseUpdateEmployeeInput(
  input: unknown,
): UpdateEmployeeSchema {
  return updateEmployeeSchema.parse(input);
}

export function parseTransferDepartmentInput(
  input: unknown,
): TransferDepartmentSchema {
  return transferDepartmentSchema.parse(input);
}

export function parseTransferPositionInput(
  input: unknown,
): TransferPositionSchema {
  return transferPositionSchema.parse(input);
}

export function parseTransferRolesInput(
  input: unknown,
): TransferRolesSchema {
  return transferRolesSchema.parse(input);
}
