import { z } from "@base/ui";

export interface NavigationTreeNodeSchemaInput {
  id: string;
  parentId?: string | null;
  itemType: "GROUP" | "PAGE" | "LINK";
  pageKey?: string | null;
  externalUrl?: string | null;
  openInNewTab?: boolean;
  customLabel?: string | null;
  customIcon?: string | null;
  sortOrder?: number;
  isVisible?: boolean;
  children?: NavigationTreeNodeSchemaInput[];
}

/**
 * 导航菜单树节点 Schema (SSoT)
 */
export const navigationTreeNodeSchema: z.ZodType<NavigationTreeNodeSchemaInput> =
  z.lazy(() =>
    z.object({
      id: z.string().min(1),
      parentId: z.string().nullable().optional(),
      itemType: z.enum(["GROUP", "PAGE", "LINK"]),
      pageKey: z.string().nullable().optional(),
      externalUrl: z.string().nullable().optional(),
      openInNewTab: z.boolean().default(false),
      customLabel: z.string().nullable().optional(),
      customIcon: z.string().nullable().optional(),
      sortOrder: z.number().int().default(0),
      isVisible: z.boolean().default(true),
      children: z.array(navigationTreeNodeSchema).default([]),
    }),
  );

/**
 * 保存菜单树请求 Schema (SSoT)
 */
export const saveMenuTreeSchema = z.object({
  nodes: z.array(navigationTreeNodeSchema),
});

export type SaveMenuTreeSchema = z.infer<typeof saveMenuTreeSchema>;
