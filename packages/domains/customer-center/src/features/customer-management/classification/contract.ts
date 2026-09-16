import {
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@base/authorization";
import type { SearchContract } from "@base/shared";

/** 分类与标签同页展示，但分别对应真实 Prisma 实体与独立权限。 */
export const CustomerCategorySubject = "CustomerCategory";
export type CustomerCategorySubject = typeof CustomerCategorySubject;
export const CustomerCategoryResource = "customer.category";
export type CustomerCategoryResource = typeof CustomerCategoryResource;
export const CustomerTagSubject = "CustomerTag";
export type CustomerTagSubject = typeof CustomerTagSubject;
export const CustomerTagResource = "customer.tag";
export type CustomerTagResource = typeof CustomerTagResource;

export const CustomerCategoryField = {
  CATEGORY_CODE: "categoryCode",
  CATEGORY_NAME: "categoryName",
  PARENT_CODE: "parentCode",
  DESCRIPTION: "description",
  STATUS: "status",
} as const;

export const CustomerTagField = {
  TAG_CODE: "tagCode",
  TAG_NAME: "tagName",
  TAG_TYPE: "tagType",
  DESCRIPTION: "description",
  STATUS: "status",
} as const;

const classificationActions = [
  { action: StandardAction.READ, label: "查看" },
  { action: StandardAction.CREATE, label: "新建" },
  { action: StandardAction.UPDATE, label: "修改" },
  { action: StandardAction.DELETE, label: "删除" },
] as const;

export const customerCategoryPageContract: FeaturePagePermissionDescriptor = {
  resource: CustomerCategoryResource,
  subject: CustomerCategorySubject,
  label: "客户分类",
  path: "/customer/categories-tags",
  actions: classificationActions,
  configurableFields: Object.values(CustomerCategoryField).map((field) => ({
    field,
    label: field,
    sensitive: false,
  })),
} as const;

export const customerTagPageContract: FeaturePagePermissionDescriptor = {
  resource: CustomerTagResource,
  subject: CustomerTagSubject,
  label: "客户标签",
  path: "/customer/categories-tags",
  actions: classificationActions,
  configurableFields: Object.values(CustomerTagField).map((field) => ({
    field,
    label: field,
    sensitive: false,
  })),
} as const;

/** 业务标签搜索契约 (SSoT) */
export const customerTagSearchContract: SearchContract = {
  direct: [
    { field: "tagCode", label: "标签编码" },
    { field: "tagName", label: "标签名称" },
    { field: "description", label: "说明" },
  ],
} as const;

/** @deprecated Use independent category/tag descriptors. */
export const categoryTagPageContract = customerCategoryPageContract;
