/**
 * 客户中心视图与组件微观 DDD 聚合收敛导出
 */

// 1. 客户档案聚合
export * from "./customers/CustomerView";
export * from "./customers/CreateCustomerModal";

// 2. 报价单聚合
export * from "./quotes/QuoteView";
export * from "./quotes/CreateQuoteModal";

// 3. 履约门店聚合
export * from "./stores/StoreView";
export * from "./stores/CreateStoreModal";

// 4. 分类与业务标签聚合
export * from "./categories-tags/CategoryTagView";
export * from "./categories-tags/CreateCategoryModal";
export * from "./categories-tags/CreateTagModal";

// 5. 跨实体切片私有共享
export * from "./shared/CustomerAbilityBoundary";
