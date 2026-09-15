import type {
  StandardPageDescriptor,
  TenantMenuNode,
} from "@base/authorization";

export interface SaveMenuItemInput {
  readonly id?: string;
  readonly parentId?: string | null;
  readonly itemType: "GROUP" | "PAGE" | "LINK";
  readonly pageKey?: string | null;
  readonly externalUrl?: string | null;
  readonly openInNewTab?: boolean;
  readonly customLabel?: string | null;
  readonly customIcon?: string | null;
  readonly sortOrder: number;
  readonly isVisible?: boolean;
}

export interface SaveMenuTreeInput {
  readonly items: readonly SaveMenuItemInput[];
}

export interface NavigationConfigData {
  /** 当前租户已保存的自定义菜单树（若从未配置，返回空数组） */
  readonly currentTree: readonly TenantMenuNode[];
  /** 全局所有可用的标准功能页面列表（按业务切片分组供选择） */
  readonly availablePages: readonly StandardPageDescriptor[];
  /** 是否使用的是出厂默认设置（即数据库中尚未有自定义记录） */
  readonly isDefault: boolean;
}
