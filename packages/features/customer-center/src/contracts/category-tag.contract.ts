import {
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@chenrun/authorization";

/** 客户分类与标签实体与资源标识 (SSoT) */
export const CustomerCategorySubject = "CustomerCategory";
export const CustomerTagSubject = "CustomerTag";
export const CustomerCategoryTagResource = "customer_category_tag";

/**
 * 客户中心 - 分类与标签页面纯数据权限契约 (SSoT)
 */
export const categoryTagPageContract: FeaturePagePermissionDescriptor = {
  resource: CustomerCategoryTagResource,
  subject: CustomerCategorySubject,
  label: "分类与标签",
  path: "/customer/categories-tags",
  actions: [
    { action: StandardAction.READ, label: "查看分类/标签" },
    { action: StandardAction.CREATE, label: "新建分类/标签" },
    { action: StandardAction.UPDATE, label: "修改分类/标签" },
    { action: StandardAction.DELETE, label: "删除分类/标签" },
  ],
} as const;
