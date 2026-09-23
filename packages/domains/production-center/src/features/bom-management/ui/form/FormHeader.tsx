import { Edit, Save, Check } from "lucide-react";
import {
	AuthGuard,
	Button,
	Badge,
	ConfirmDialog,
	DocumentHeader,
	Tabs,
	TabsList,
	TabsTrigger,
	type FormPageMode,
} from "@base/ui";
import { StandardAction, useAbility } from "@base/authorization";
import {
	BOM_TYPES,
	BomSubject,
	BomAction,
	BomField,
	type BomType,
} from "../../contract";

export interface FormHeaderProps {
	readonly mode: FormPageMode;
	readonly bomId?: string;
	readonly name: string;
	readonly initialPrimaryProductName?: string;
	readonly initialVersionName?: string;
	readonly isDefault: boolean;
	readonly bomType: BomType;
	readonly submitting: boolean;
	readonly setBomType?: (type: BomType) => void;
	readonly onSave: (isDraft: boolean) => void;
	readonly onCancel: () => void;
	readonly onEdit: () => void;
}

export function FormHeader({
	mode,
	name,
	initialPrimaryProductName,
	initialVersionName,
	isDefault,
	bomType,
	submitting,
	setBomType,
	onSave,
	onCancel,
	onEdit,
}: FormHeaderProps) {
	const isView = mode === "view";
	const isEdit = mode === "edit";
	const isCreate = mode === "create";

	const ability = useAbility();
	const canReadName = ability.can("read", BomSubject, BomField.NAME);
	const displayName = canReadName
		? name || initialPrimaryProductName || initialVersionName
		: initialPrimaryProductName;

	const titleText = isView
		? `BOM 方案详情: ${displayName || ""}`
		: isEdit
			? `编辑生产 BOM: ${displayName || ""}`
			: "新建生产 BOM";

	return (
		<DocumentHeader
			onBack={onCancel}
			backText="返回"
			title={titleText}
			badges={
				isDefault ? (
					<Badge
						variant="default"
						size="sm"
						className="bg-blue-600 hover:bg-blue-600 text-xs py-0 h-5 px-2"
					>
						默认BOM
					</Badge>
				) : null
			}
			/* 中部插槽：官方 Tabs 分段控制器注入，自带平滑物理滑块动画与键盘无障碍切换 */
			slotMiddle={
				isCreate && setBomType ? (
					<Tabs
						value={bomType}
						onValueChange={(val) => val && setBomType(val as BomType)}
					>
						<TabsList className="h-7.5 p-0.5 bg-muted/70 border border-border/70 rounded-md">
							<TabsTrigger
								value={BOM_TYPES.PROCESSING}
								className="h-6.5 px-2.5 text-xs rounded-xs font-medium transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer data-active:font-bold data-active:text-blue-600 dark:data-active:text-blue-400"
							>
								单品BOM
							</TabsTrigger>
							<TabsTrigger
								value={BOM_TYPES.FORMULA}
								className="h-6.5 px-2.5 text-xs rounded-xs font-medium transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer data-active:font-bold data-active:text-blue-600 dark:data-active:text-blue-400"
							>
								组合BOM
							</TabsTrigger>
							<TabsTrigger
								value={BOM_TYPES.PACKAGING}
								className="h-6.5 px-2.5 text-xs rounded-xs font-medium transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer data-active:font-bold data-active:text-blue-600 dark:data-active:text-blue-400"
							>
								包装BOM
							</TabsTrigger>
						</TabsList>
					</Tabs>
				) : (
					<Badge
						variant="outline"
						size="sm"
						className="text-xs py-0 h-5 px-2 font-normal"
					>
						{bomType === "PROCESSING"
							? "单品加工"
							: bomType === "FORMULA"
								? "组合配方"
								: "包装装配"}
					</Badge>
				)
			}
			slotActions={
				isView ? (
					<AuthGuard action={StandardAction.UPDATE} subject={BomSubject}>
						<Button
							type="button"
							size="sm"
							onClick={onEdit}
							className="h-8 text-xs gap-1.5 px-3 transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer"
						>
							<Edit className="size-3.5" /> 编辑方案
						</Button>
					</AuthGuard>
				) : (
					<>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={onCancel}
							disabled={submitting}
							className="h-8 text-xs px-3 transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer"
						>
							取消
						</Button>
						<AuthGuard
							action={isEdit ? StandardAction.UPDATE : StandardAction.CREATE}
							subject={BomSubject}
						>
							<Button
								type="button"
								variant="secondary"
								size="sm"
								onClick={() => onSave(true)}
								disabled={submitting}
								className="h-8 text-xs gap-1.5 px-3 min-w-[76px] transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer"
							>
								<Save className="size-3.5 text-muted-foreground" />
								{submitting ? "保存中..." : "保存草稿"}
							</Button>
						</AuthGuard>
						<AuthGuard action={BomAction.PUBLISH} subject={BomSubject}>
							<ConfirmDialog
								trigger={
									<Button
										type="button"
										size="sm"
										disabled={submitting}
										className="h-8 text-xs gap-1.5 px-3.5 min-w-[84px] bg-blue-600 hover:bg-blue-700 text-white transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
									>
										<Check className="size-3.5" />
										{submitting
											? "处理中..."
											: isEdit
												? "发布新版本"
												: "立即发布"}
									</Button>
								}
								title={
									isEdit
										? "确认发布生产 BOM 新版本？"
										: "确认立即发布生产 BOM 方案？"
								}
								description={
									isEdit
										? "编辑发布生产BOM后只影响后续未生成的生产计划与工单，历史及已生成的计划不受影响。"
										: "发布后该方案将作为生效标准，供后续创建生产计划与工单时引用。"
								}
								confirmText="确认发布"
								cancelText="返回修改"
								onConfirm={() => onSave(false)}
							/>
						</AuthGuard>
					</>
				)
			}
		/>
	);
}
