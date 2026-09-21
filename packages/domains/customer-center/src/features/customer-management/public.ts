export { CustomerView, type CustomerViewProps } from "./ui/CustomerView";
export {
	CustomerFormPage,
	type CustomerFormPageProps,
	type CustomerFormData,
	DEFAULT_CUSTOMER_VALUES,
	customerFormZodSchema,
} from "./ui/CustomerFormPage";
/** 契约 SSoT：权限 + 列表 URL（customerSearchParams 等） */
export * from "./contract";
export type * from "./types";
export {
  createCustomerSchema,
  updateCustomerSchema,
  parseCreateCustomerInput,
  parseUpdateCustomerInput,
} from "./schema";
export type { CustomerPageOptions } from "./types";
