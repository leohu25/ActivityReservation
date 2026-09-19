import { z } from "@base/ui";
import type { CreatePositionInput, UpdatePositionInput } from "./types";

export const createPositionSchema = z.object({
  name: z
    .string()
    .min(1, "岗位名称不能为空")
    .max(50, "岗位名称最多50个字符"),
  code: z
    .string()
    .min(1, "岗位编码不能为空")
    .max(50, "岗位编码最多50个字符"),
  description: z.string().optional().nullable(),
  sort: z.number().default(0),
});

export const updatePositionSchema = createPositionSchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export type CreatePositionSchema = z.infer<typeof createPositionSchema>;
export type UpdatePositionSchema = z.infer<typeof updatePositionSchema>;

export function parseCreatePositionInput(raw: unknown): CreatePositionInput {
  return createPositionSchema.parse(raw);
}

export function parseUpdatePositionInput(raw: unknown): UpdatePositionInput {
  return updatePositionSchema.parse(raw);
}
