"use client";

import React, {
	useState,
	useEffect,
	useMemo,
	useCallback,
	useRef,
	type ReactNode,
} from "react";
import { z } from "zod";
import { Save, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { FormFields, type FormFieldSchema } from "./FormFields";
import { FormBanner } from "./FormLayout";
import { DetailTable, type DetailTableColumn } from "../data-table/DetailTable";
import { DocumentHeader } from "../layout/DocumentHeader";
import { AuthGuard } from "../auth/AuthGuard";
import { toast } from "../feedback/Toast";
import { useUiAbility, type UiAbilityLike } from "../auth";
import { updateTabTitle, closeCurrentTab } from "../layout/TabBar";
import { useSafeRouter } from "../../lib/use-safe-router";
import { formatErrorMessage } from "@base/shared";
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

	// Zod 运行时强类型校验 (强制单一事实源，驱动表单合法性校验与字段标红)
	readonly schema: z.ZodType<TValues> | z.ZodType<any>;

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
	/** 操作动作栏位置：默认 'top' 整合至 DocumentHeader 顶栏，亦支持 'bottom' 或 'both' */
	readonly actionsPlacement?: "top" | "bottom" | "both";
	/** DocumentHeader 中部扩展插槽 (如类型分段 Tabs) */
	readonly slotMiddle?: ReactNode;
	/** DocumentHeader 右侧操作区插槽 (完全自定义替换默认按钮组) */
	readonly slotActions?: ReactNode;
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
 * 通用标准全屏单据表单工作台 (FormPage)
 * - 针对复杂主从表单据全屏多页签（Tab）定制；
 * - 核心参数 (sections, fields, schema, detailConfig) 与 FormModal 100% 兼容；
 * - 原生支持 CASL 字段权限三态闭环（HIDDEN / READONLY / EDITABLE）；
 * - 集成顶部紧凑操作栏、多区块卡片分区、宽幅明细表格 (DetailTable) 与自动页签标题联动。
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
	stickyFooter = false,
	actionsPlacement = "top",
	slotMiddle,
	slotActions: customSlotActions,
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
	const [itemCellErrors, setItemCellErrors] = useState<Record<string, string>>({});
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

	// 收集当前界面真正可见的字段名称集合，供动态必填校验与提交过滤使用
	const visibleFieldNames = useMemo(() => {
		const names = new Set<string>();
		for (const f of activeFields) {
			names.add(f.name);
		}
		for (const s of activeSections) {
			for (const f of s.fields) {
				names.add(f.name);
			}
		}
		return names;
	}, [activeFields, activeSections]);

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

		// 1. 如果配置了 detailConfig.minRows，先校验明细最低行数
		if (
			activeDetailConfig &&
			typeof activeDetailConfig.minRows === "number" &&
			activeDetailConfig.minRows > 0 &&
			items.length < activeDetailConfig.minRows
		) {
			toast.error(
				activeDetailConfig.minRows === 1
					? "明细条目至少需要添加一行数据"
					: `明细条目至少需要添加 ${activeDetailConfig.minRows} 行数据`,
			);
			return;
		}

		const currentValues = valuesRef.current;
		const nextErrors: Partial<Record<keyof TValues & string, string>> = {};
		const nextItemErrors: Record<string, string> = {};
		let detailArrayErrorMessage: string | null = null;

		// 2. 主表 schema 校验（支持包含 items 数组或仅有主表字段）
		if (effectiveSchema) {
			const fullPayload = activeDetailConfig
				? { ...currentValues, items }
				: currentValues;
			const result = effectiveSchema.safeParse(fullPayload);
			if (!result.success) {
				const issues = result.error.issues;
				for (const issue of issues) {
					const rootKey = String(issue.path[0] ?? "");
					// 处理 items 数组字段的错误
					if (rootKey === "items") {
						if (issue.path.length >= 3 && typeof issue.path[1] === "number") {
							const rowIdx = issue.path[1];
							const fieldId = String(issue.path[2]);
							const key = `${rowIdx}.${fieldId}`;
							if (!nextItemErrors[key]) {
								nextItemErrors[key] = issue.message;
							}
						} else if (!detailArrayErrorMessage) {
							detailArrayErrorMessage = issue.message;
						}
						continue;
					}

					// 豁免逻辑：若当前启用了受控主体权限 (subject)，且该字段被 HIDDEN 彻底隐藏（不在可见字段集合），自动豁免该字段的校验错误
					if (
						subject &&
						effectiveAbility &&
						!visibleFieldNames.has(rootKey)
					) {
						continue;
					}
					if (rootKey && !nextErrors[rootKey as keyof TValues & string]) {
						nextErrors[rootKey as keyof TValues & string] = issue.message;
					}
				}
			}
		}

		// 3. 独立明细行 schema 校验
		if (activeDetailConfig && effectiveItemsSchema) {
			const arraySchema =
				effectiveItemsSchema instanceof z.ZodArray
					? effectiveItemsSchema
					: z.array(effectiveItemsSchema);
			const itemsResult = arraySchema.safeParse(items);
			if (!itemsResult.success) {
				for (const issue of itemsResult.error.issues) {
					const rowIdx = issue.path[0];
					const fieldId = issue.path[1];
					if (typeof rowIdx === "number" && fieldId !== undefined) {
						const key = `${rowIdx}.${String(fieldId)}`;
						if (!nextItemErrors[key]) {
							nextItemErrors[key] = issue.message;
						}
					} else if (!detailArrayErrorMessage) {
						detailArrayErrorMessage = issue.message;
					}
				}
			}
		}

		if (
			Object.keys(nextErrors).length > 0 ||
			Object.keys(nextItemErrors).length > 0 ||
			detailArrayErrorMessage
		) {
			setErrors(nextErrors);
			setItemCellErrors(nextItemErrors);
			if (detailArrayErrorMessage && Object.keys(nextItemErrors).length === 0) {
				toast.error(detailArrayErrorMessage);
			} else {
				toast.error("表单数据校验未通过，请检查标红提示项");
			}
			return;
		}

		setItemCellErrors({});

		if (!onSubmit) return;

		setSubmitting(true);
		try {
			await onSubmit(currentValues, { items: [...items] });
		} catch (err: unknown) {
			const msg = formatErrorMessage(err, "保存单据失败");
			toast.error(msg);
		} finally {
			setSubmitting(false);
		}
	};

	const defaultSubmitText =
		submitText ||
		(mode === "create" ? "立即保存" : mode === "edit" ? "保存更改" : "确认");

	const renderActionButtons = (size: "sm" | "default" = "sm") => (
		<div className="flex items-center gap-2 shrink-0">
			{headerExtra}

			{extraActions.map((act) => (
				<Button
					key={act.key}
					type="button"
					size={size}
					variant={act.variant || "outline"}
					onClick={() => act.onClick(values)}
					disabled={submitting}
					className="h-8 text-xs cursor-pointer"
				>
					{act.label}
				</Button>
			))}

			{!isView ? (
				<Button
					type="button"
					size={size}
					variant="ghost"
					onClick={handleReset}
					disabled={submitting}
					className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
					title="重置修改"
				>
					<RotateCcw className="size-3.5 mr-1" />
					重置
				</Button>
			) : null}

			<Button
				type="button"
				size={size}
				variant="outline"
				onClick={handleBack}
				disabled={submitting}
				className="h-8 text-xs cursor-pointer"
			>
				{cancelText}
			</Button>

			{!isView && onSubmit ? (
				subject ? (
					<AuthGuard action={mode === "edit" ? "update" : "create"} subject={subject}>
						<Button
							type="button"
							size={size}
							variant="default"
							onClick={() => handleSubmit()}
							disabled={submitting}
							className="h-8 text-xs min-w-[5.5rem] cursor-pointer shadow-xs"
						>
							{submitting ? (
								<Loader2 className="size-3.5 mr-1.5 animate-spin" />
							) : (
								<Save className="size-3.5 mr-1.5" />
							)}
							{defaultSubmitText}
						</Button>
					</AuthGuard>
				) : (
					<Button
						type="button"
						size={size}
						variant="default"
						onClick={() => handleSubmit()}
						disabled={submitting}
						className="h-8 text-xs min-w-[5.5rem] cursor-pointer shadow-xs"
					>
						{submitting ? (
							<Loader2 className="size-3.5 mr-1.5 animate-spin" />
						) : (
							<Save className="size-3.5 mr-1.5" />
						)}
						{defaultSubmitText}
					</Button>
				)
			) : null}
		</div>
	);

	const topActions =
		customSlotActions ||
		(actionsPlacement === "top" || actionsPlacement === "both"
			? renderActionButtons("sm")
			: headerExtra);

	const headerBadges = (
		<div className="flex items-center gap-1.5 shrink-0">
			{badge ? (
				<Badge
					variant="secondary"
					className="font-mono text-[10px] px-1.5 py-0 h-4 uppercase tracking-wider shrink-0"
				>
					{badge}
				</Badge>
			) : null}

			{documentNumber ? (
				<span className="font-mono text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/60">
					{documentNumber}
				</span>
			) : null}

			{statusBadge}
		</div>
	);

	return (
		<div
			className={cn(
				"flex flex-col h-full w-full bg-background text-foreground overflow-hidden",
				className,
			)}
		>
			{/* 1. 单据顶部工具栏：自然顶格贴边吸附 */}
			<DocumentHeader
				onBack={handleBack}
				backText={backText}
				title={
					resolvedDescription ? (
						<div className="flex flex-col min-w-0 justify-center">
							<span className="truncate">{resolvedTitle}</span>
							<span className="text-[11px] font-normal text-muted-foreground truncate">
								{resolvedDescription}
							</span>
						</div>
					) : (
						resolvedTitle
					)
				}
				badges={headerBadges}
				slotMiddle={slotMiddle}
				slotActions={topActions}
				className={cn(stickyHeader && "sticky top-0 z-20 shrink-0")}
			/>

			{/* 2. 单据内容独立滚动视口：滚动完全收敛在操作栏下方，彻底杜绝向上穿透与透光缝隙 */}
			<div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">
				<div className="max-w-6xl w-full mx-auto space-y-6">
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
									subject={subject}
									action={mode === "edit" ? "update" : "create"}
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
							subject={subject}
							action={mode === "edit" ? "update" : "create"}
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
							onChange={(next) => {
								setItemCellErrors({});
								(onItemsChange || setInternalItems)(next);
							}}
							onAddRow={activeDetailConfig.onAddRow}
							addText={activeDetailConfig.addText}
							minRows={activeDetailConfig.minRows}
							readOnly={isView || activeDetailConfig.readOnly}
							emptyText={activeDetailConfig.emptyText}
							summary={activeDetailConfig.summary}
							cellErrors={itemCellErrors}
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
			</div>

			{/* 3. 单据底部操作栏 (可选，当 actionsPlacement 包含 bottom 时渲染) */}
			{(stickyFooter || actionsPlacement === "bottom" || actionsPlacement === "both") ? (
				<div className="sticky bottom-0 border-t border-border/70 bg-background/95 backdrop-blur-xs px-6 py-3 mt-auto shadow-xs z-10">
					<div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
						<div className="text-xs text-muted-foreground font-mono truncate">
							{auditHint || null}
						</div>

						{renderActionButtons("sm")}
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
