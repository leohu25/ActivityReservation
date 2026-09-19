import { z } from "@base/ui";

/** 创建部门 Zod 校验 Schema (SSoT) */
export const createDepartmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "部门名称为必填项")
    .max(50, "部门名称不能超过 50 个字符"),
  code: z
    .string()
    .trim()
    .min(1, "部门编码为必填项")
    .max(30, "部门编码不能超过 30 个字符")
    .regex(/^[A-Za-z0-9_.-]+$/, "部门编码仅支持英文字母、数字、下划线、中划线及点"),
  parentId: z.string().optional().default(""),
  sort: z.coerce.number().int("排序序号必须为整数").min(0).default(0),
});

export type CreateDepartmentSchema = z.infer<typeof createDepartmentSchema>;

/** 更新部门 Zod 校验 Schema (SSoT) */
export const updateDepartmentSchema = createDepartmentSchema.partial();

export type UpdateDepartmentSchema = z.infer<typeof updateDepartmentSchema>;

export const parseCreateDepartmentInput = (raw: unknown): CreateDepartmentSchema =>
  createDepartmentSchema.parse(raw);

export const parseUpdateDepartmentInput = (raw: unknown): UpdateDepartmentSchema =>
  updateDepartmentSchema.parse(raw);
