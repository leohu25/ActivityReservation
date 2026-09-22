"use client";

import React, {
	useState,
	useEffect,
	useMemo,
	useCallback,
	useRef,
	type ReactNode,
} from "react";
import type { z } from "zod";
import { ArrowLeft, Save, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { FormFields, type FormFieldSchema } from "./FormFields";
import { FormBanner } from "./FormLayout";
import { DetailTable, type DetailTableColumn } from "../data-table/DetailTable";
import { toast } from "../feedback/Toast";
import { useUiAbility, type UiAbilityLike } from "../auth";
import { updateTabTitle, closeCurrentTab } from "../layout/TabBar";
import { useSafeRouter } from "../../lib/use-safe-router";
import { cn } from "../../lib/utils";

export type FormPageMode = "create" | "edit" | "view";

export interface FormPageSection {
	readonly title?: string;
	readonly description?: string;
	readonly fields: readonly FormFieldSchema[];
	readonly columns?: 2 | 3 | 4;
}

export interface FormPageDetailConfig<TItem> {
	readonly title?: string;
	readonly description?: string;
	readonly columns: readonly DetailTableColumn<TItem>[];
	readonly onAddRow?: () => TItem;
	readonly addText?: string;
	readonly minRows?: number;
	readonly readOnly?: boolean;
	readonly emptyText?: string;
	readonly summary?: ReactNode;
	readonly schema?: z.ZodType<any>;
}

export interface FormPageProps<
	TValues extends Record<string, unknown> = Record<string, unknown>,
	TItem = unknown,
> {
	readonly mode?: FormPageMode;
	readonly title?: ReactNode | ((values: TValues) => ReactNode);
	readonly description?: ReactNode | ((values: TValues) => ReactNode);
	readonly badge?: string;
	readonly documentNumber?: string;
	readonly statusBadge?: ReactNode;
	readonly bannerTitle?: string;
	readonly bannerDescription?: string;
	readonly banner?: {
		readonly title: string;
		readonly description?: string;
	};
	readonly headerExtra?: ReactNode;

	// 字段配置 (单个列表或多区块)
	readonly fields?: readonly FormFieldSchema[];
	readonly sections?: readonly FormPageSection[];

	// 初始值与联动
	readonly initialValues: TValues;
	readonly onValuesChange?: (
		name: keyof TValues & string,
		value: unknown,
		prevValues: TValues,
	) => Partial<TValues> | void;

	// Zod 运行时强类型校验
	readonly schema?: z.ZodType<TValues> | z.ZodType<any>;

	// 内置明细表集成 (DetailTable)
	readonly detailConfig?: FormPageDetailConfig<TItem>;
	readonly initialItems?: readonly TItem[];
	readonly items?: readonly TItem[];
	readonly onItemsChange?: (items: TItem[]) => void;
	readonly itemsSchema?: z.ZodType<any>;

	// 返回与关闭
	readonly onBack?: () => void;
	readonly backUrl?: string;
	readonly backText?: string;

	// 提交与自定义动作
	readonly onSubmit?: (
		values: TValues,
		context: { items: TItem[] },
	) => Promise<void> | void;
	readonly submitText?: string;
	readonly cancelText?: string;
	readonly auditHint?: string | null;
	readonly extraActions?: readonly {
		readonly key: string;
		readonly label: string;
		readonly variant?: "default" | "outline" | "ghost" | "destructive";
		readonly onClick: (values: TValues) => void | Promise<void>;
	}[];

	/**
	 * 业务实体 Subject (如 'Customer')。
	 * 声明后 FormPage 将全自动结合 CASL Ability 执行字段三态闭环：
	 * - HIDDEN (不可读): 自动从 fields / sections 中彻底剥离隐藏；
	 * - READONLY (可读不可写): 在新增/编辑模式下自动标记 disabled 并展示只读提示；
	 * - 整组字段全部被隐藏的 section 自动剔除。
	 */
	readonly subject?: string;

	/** 可选 Ability 覆盖注入。默认从上下文 UiAbilityProvider 读取 */
	readonly ability?: UiAbilityLike | null;

	// 布局与多标签联动
	readonly columns?: 2 | 3 | 4;
	readonly stickyHeader?: boolean;
	readonly stickyFooter?: boolean;
	readonly updateTabTitle?: boolean;
	readonly tabTitle?: string;
	readonly className?: string;
	readonly extraContent?: ReactNode | ((values: TValues) => ReactNode);
	readonly children?:
		| ReactNode
		| ((context: {
				values: TValues;
				back: () => void;
				loading: boolean;
		  }) => ReactNode);
	readonly footer?:
		| ReactNode
		| ((context: {
				values: TValues;
				back: () => void;
				loading: boolean;
		  }) => ReactNode);
}

const EMPTY_INITIAL_ITEMS: readonly any[] = [];
const EMPTY_ACTIONS: readonly any[] = [];

function safeSerialize(val: unknown): string {
	try {
		return JSON.stringify(val);
	} catch {
		return "";
	}
}

/**
 * 现代工业级全屏单据表单工作台 (FormPage)
 * - 针对复杂 ERP 主从表单据全屏多页签（Tab）定制；
 * - 核心参数 (sections, fields, schema, detailConfig) 与 FormModal 100% 兼容；
 * - 原生支持 CASL 字段权限三态闭环（HIDDEN / READONLY / EDITABLE）；
 * - 集成顶部紧凑工业风操作栏、多区块卡片分区、宽幅明细表格 (DetailTable) 与自动页签标题联动。
 */
export function FormPage<
	TValues extends Record<string, unknown> = Record<string, unknown>,
	TItem = unknown,
>({
	mode = "create",
	title,
	description,
	badge = "单据",
	documentNumber,
	statusBadge,
	bannerTitle,
	bannerDescription,
	banner,
	headerExtra,
	fields,
	sections,
	initialValues,
	onValuesChange,
	schema,
	subject,
	ability: explicitAbility,
	detailConfig,
	initialItems = EMPTY_INITIAL_ITEMS,
	items: controlledItems,
	onItemsChange,
	itemsSchema,
	onBack,
	backUrl,
	backText = "返回列表",
	onSubmit,
	submitText,
	cancelText = "取消",
	auditHint,
	extraActions = EMPTY_ACTIONS,
	columns = 3,
	stickyHeader = true,
	stickyFooter = true,
	updateTabTitle: enableUpdateTabTitle = true,
	tabTitle,
	className,
	extraContent,
	children,
	footer,
}: FormPageProps<TValues, TItem>) {
	const router = useSafeRouter();
	const activeDetailConfig = detailConfig;
	const effectiveSchema = schema;
	const effectiveItemsSchema = itemsSchema ?? activeDetailConfig?.schema;
	const isView = mode === "view";

	const getFreshValues = useCallback((): TValues => {
		try {
			return structuredClone(initialValues);
		} catch {
			return JSON.parse(JSON.stringify(initialValues));
		}
	}, [initialValues]);

	const [values, setValues] = useState<TValues>(getFreshValues);
	const valuesRef = useRef<TValues>(values);
	valuesRef.current = values;

	const [internalItems, setInternalItems] = useState<TItem[]>(() => [
		...initialItems,
	]);
	const items = controlledItems ?? internalItems;
	const [errors, setErrors] = useState<
		Partial<Record<keyof TValues & string, string>>
	>({});
	const [submitting, setSubmitting] = useState(false);

	const prevValuesSerializedRef = useRef<string>(safeSerialize(initialValues));
	const prevItemsSerializedRef = useRef<string>(safeSerialize(initialItems));

	// 初始值发生变化时同步更新
	useEffect(() => {
		const currentValuesSerialized = safeSerialize(initialValues);
		const currentItemsSerialized = safeSerialize(initialItems);
		if (
			currentValuesSerialized !== prevValuesSerializedRef.current ||
			currentItemsSerialized !== prevItemsSerializedRef.current
		) {
			const fresh = getFreshValues();
			valuesRef.current = fresh;
			setValues(fresh);
			setInternalItems([...initialItems]);
			setErrors({});
			prevValuesSerializedRef.current = currentValuesSerialized;
			prevItemsSerializedRef.current = currentItemsSerialized;
		}
	}, [initialValues, initialItems, getFreshValues]);

	// 计算标题文本
	const resolvedTitle =
		typeof title === "function" ? title(values) : title || "业务单据";
	const resolvedDescription =
		typeof description === "function" ? description(values) : description;

	// 自动更新 TabBar 页签标题
	useEffect(() => {
		if (!enableUpdateTabTitle || typeof window === "undefined") return;
		let displayTitle = tabTitle;
		if (!displayTitle) {
			if (typeof resolvedTitle === "string") {
				displayTitle = resolvedTitle;
			} else {
				displayTitle =
					mode === "create"
						? "新建单据"
						: mode === "edit"
							? "编辑单据"
							: "查看单据";
			}
		}
		updateTabTitle(displayTitle);
	}, [enableUpdateTabTitle, tabTitle, resolvedTitle, mode]);

	// 返回与关闭逻辑
	const handleBack = useCallback(() => {
		if (onBack) {
			onBack();
			return;
		}
		if (backUrl) {
			closeCurrentTab({ redirectTo: backUrl });
		} else {
			closeCurrentTab();
			router?.back();
		}
	}, [onBack, backUrl, router]);

	// Ability 权限感知
	const contextAbility = useUiAbility();
	const effectiveAbility =
		explicitAbility === undefined ? contextAbility : explicitAbility;
	const writeAction = mode === "create" ? "create" : "update";

	const filterAndDecorateField = useCallback(
		(field: FormFieldSchema): FormFieldSchema | null => {
			if (!subject || !effectiveAbility) {
				return isView ? { ...field, disabled: true } : field;
			}

			const authKey = field.field || field.name;
			const canRead = effectiveAbility.can("read", subject, authKey);
			if (!canRead) return null;

			if (isView) return { ...field, disabled: true };

			const canWrite = effectiveAbility.can(writeAction, subject, authKey);
			if (!canWrite) {
				return {
					...field,
					disabled: true,
					hint: field.hint
						? `${field.hint} (受字段权限控制，当前角色不可修改)`
						: "受字段权限控制，当前角色不可修改",
				};
			}

			return field;
		},
		[subject, effectiveAbility, isView, writeAction],
	);

	const activeFields = useMemo(() => {
		if (!fields) return [];
		return fields
			.map(filterAndDecorateField)
			.filter((f): f is FormFieldSchema => f !== null);
	}, [fields, filterAndDecorateField]);

	const activeSections = useMemo(() => {
		if (!sections) return [];
		return sections
			.map((s) => {
				const visibleFields = s.fields
					.map(filterAndDecorateField)
					.filter((f): f is FormFieldSchema => f !== null);
				return {
					...s,
					fields: visibleFields,
				};
			})
			.filter((s) => s.fields.length > 0);
	}, [sections, filterAndDecorateField]);

	const handleFieldChange = useCallback(
		(name: string, value: unknown) => {
			setValues((prev) => {
				const next = { ...prev, [name]: value };
				if (onValuesChange) {
					const patch = onValuesChange(
						name as keyof TValues & string,
						value,
						prev,
					);
					if (patch && typeof patch === "object") {
						Object.assign(next, patch);
					}
				}
				valuesRef.current = next;
				return next;
			});

			if (errors[name as keyof TValues & string]) {
				setErrors((prev) => {
					const next = { ...prev };
					delete next[name as keyof TValues & string];
					return next;
				});
			}
		},
		[onValuesChange, errors],
	);

	const handleReset = useCallback(() => {
		const fresh = getFreshValues();
		valuesRef.current = fresh;
		setValues(fresh);
		setInternalItems([...initialItems]);
		setErrors({});
		toast.info("已重置表单至初始状态");
	}, [getFreshValues, initialItems]);

	const handleSubmit = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		if (isView) return;

		const currentValues = valuesRef.current;
		const nextErrors: Partial<Record<keyof TValues & string, string>> = {};

		if (effectiveSchema) {
			const result = effectiveSchema.safeParse(currentValues);
			if (!result.success) {
				const issues = result.error.issues;
				for (const issue of issues) {
					const fieldKey = issue.path[0] as keyof TValues & string;
					if (fieldKey && !nextErrors[fieldKey]) {
						nextErrors[fieldKey] = issue.message;
					}
				}
			}
		}

		if (activeDetailConfig && effectiveItemsSchema) {
			const itemsResult = effectiveItemsSchema.safeParse(items);
			if (!itemsResult.success) {
				toast.error(
					`明细表校验未通过: ${itemsResult.error.issues[0]?.message || "数据有误"}`,
				);
				return;
			}
		}

		if (Object.keys(nextErrors).length > 0) {
			setErrors(nextErrors);
			toast.error("表单校验失败，请检查标红字段");
			return;
		}

		if (!onSubmit) return;

		setSubmitting(true);
		try {
			await onSubmit(currentValues, { items: [...items] });
		} finally {
			setSubmitting(false);
		}
	};

	const defaultSubmitText =
		submitText ||
		(mode === "create" ? "立即保存" : mode === "edit" ? "保存更改" : "确认");

	return (
		<div
			className={cn(
				"flex flex-col min-h-[calc(100vh-8rem)] w-full bg-background text-foreground animate-in fade-in-50 duration-150",
				className,
			)}
		>
			{/* 1. 单据顶部工具栏 (Header - 紧凑工业风) */}
			<div
				className={cn(
					"border-b border-border/70 bg-background/95 backdrop-blur-xs px-5 py-2 z-10 transition-all",
					stickyHeader && "sticky top-0 shadow-2xs",
				)}
			>
				<div className="flex items-center justify-between gap-2.5 min-h-7">
					{/* 标题、返回与徽章信息 */}
					<div className="flex items-center gap-2.5 min-w-0">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleBack}
							className="size-7 p-0 text-muted-foreground hover:text-foreground shrink-0"
							title={backText}
						>
							<ArrowLeft className="size-3.5" />
							<span className="sr-only">{backText}</span>
						</Button>

						<div className="flex flex-col min-w-0 justify-center">
							<div className="flex items-center gap-2 flex-wrap">
								{badge ? (
									<Badge
										variant="secondary"
										className="font-mono text-[10px] px-1.5 py-0 h-4 uppercase tracking-wider shrink-0"
									>
										{badge}
									</Badge>
								) : null}

								<h1 className="text-sm sm:text-base font-semibold tracking-tight text-foreground truncate">
									{resolvedTitle}
								</h1>

								{documentNumber ? (
									<span className="font-mono text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/60">
										{documentNumber}
									</span>
								) : null}

								{statusBadge}
							</div>

							{resolvedDescription ? (
								<p className="text-[11px] text-muted-foreground mt-0.5 truncate">
									{resolvedDescription}
								</p>
							) : null}
						</div>
					</div>

					{/* 顶部右侧扩展插槽（主操作按钮收敛于底部操作栏） */}
					{headerExtra ? (
						<div className="flex items-center gap-2 shrink-0">
							{headerExtra}
						</div>
					) : null}
				</div>
			</div>

			{/* 2. 单据内容工作区 (Body) */}
			<div className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
				{/* 提示横幅 */}
				{banner || bannerTitle ? (
					<FormBanner
						title={banner?.title || bannerTitle || ""}
						description={banner?.description || bannerDescription}
					/>
				) : null}

				{/* 主表分栏区块卡片 */}
				{activeSections.length > 0 ? (
					<div className="space-y-5">
						{activeSections.map((section, idx) => (
							<div
								key={section.title || idx}
								className="rounded-lg border border-border/80 bg-card p-5 shadow-2xs transition-colors"
							>
								{section.title || section.description ? (
									<div className="mb-4 pb-3 border-b border-border/50">
										{section.title ? (
											<h3 className="text-sm font-semibold text-foreground tracking-tight">
												{section.title}
											</h3>
										) : null}
										{section.description ? (
											<p className="text-xs text-muted-foreground mt-0.5">
												{section.description}
											</p>
										) : null}
									</div>
								) : null}

								<FormFields
									fields={section.fields}
									values={values}
									errors={errors}
									onChange={handleFieldChange}
									columns={section.columns || columns}
								/>
							</div>
						))}
					</div>
				) : null}

				{/* 平铺基础字段 */}
				{activeFields.length > 0 && activeSections.length === 0 ? (
					<div className="rounded-lg border border-border/80 bg-card p-5 shadow-2xs">
						<FormFields
							fields={activeFields}
							values={values}
							errors={errors}
							onChange={handleFieldChange}
							columns={columns}
						/>
					</div>
				) : null}

				{/* 明细子表 (DetailTable) */}
				{activeDetailConfig ? (
					<div className="rounded-lg border border-border/80 bg-card p-5 shadow-2xs space-y-3">
						<div className="flex items-center justify-between border-b border-border/50 pb-3">
							<div>
								<h3 className="text-sm font-semibold text-foreground tracking-tight">
									{activeDetailConfig.title || "单据明细项目"}
								</h3>
								{activeDetailConfig.description ? (
									<p className="text-xs text-muted-foreground mt-0.5">
										{activeDetailConfig.description}
									</p>
								) : null}
							</div>
						</div>

						<DetailTable<TItem>
							columns={activeDetailConfig.columns}
							data={items}
							onChange={onItemsChange || setInternalItems}
							onAddRow={activeDetailConfig.onAddRow}
							addText={activeDetailConfig.addText}
							minRows={activeDetailConfig.minRows}
							readOnly={isView || activeDetailConfig.readOnly}
							emptyText={activeDetailConfig.emptyText}
							summary={activeDetailConfig.summary}
						/>
					</div>
				) : null}

				{/* 额外扩展区域 */}
				{typeof extraContent === "function"
					? extraContent(values)
					: extraContent}

				{typeof children === "function"
					? children({ values, back: handleBack, loading: submitting })
					: children}
			</div>

			{/* 3. 单据底部操作栏 (Sticky Footer) */}
			{stickyFooter ? (
				<div className="sticky bottom-0 border-t border-border/70 bg-background/95 backdrop-blur-xs px-6 py-3 mt-auto shadow-xs z-10">
					<div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
						<div className="text-xs text-muted-foreground font-mono truncate">
							{auditHint || null}
						</div>

						<div className="flex items-center gap-2 shrink-0">
							{extraActions.map((act) => (
								<Button
									key={act.key}
									type="button"
									size="sm"
									variant={act.variant || "outline"}
									onClick={() => act.onClick(values)}
									disabled={submitting}
								>
									{act.label}
								</Button>
							))}

							{!isView ? (
								<Button
									type="button"
									size="sm"
									variant="ghost"
									onClick={handleReset}
									disabled={submitting}
									className="text-muted-foreground hover:text-foreground mr-1"
									title="重置修改"
								>
									<RotateCcw className="size-3.5 mr-1" />
									重置
								</Button>
							) : null}

							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={handleBack}
								disabled={submitting}
							>
								{cancelText}
							</Button>

							{!isView && onSubmit ? (
								<Button
									type="button"
									size="sm"
									variant="default"
									onClick={() => handleSubmit()}
									disabled={submitting}
									className="min-w-[5.5rem]"
								>
									{submitting ? (
										<Loader2 className="size-3.5 mr-1.5 animate-spin" />
									) : (
										<Save className="size-3.5 mr-1.5" />
									)}
									{defaultSubmitText}
								</Button>
							) : null}
						</div>
					</div>
				</div>
			) : null}

			{/* 自定义 Footer 插槽 */}
			{typeof footer === "function"
				? footer({ values, back: handleBack, loading: submitting })
				: footer}
		</div>
	);
}
