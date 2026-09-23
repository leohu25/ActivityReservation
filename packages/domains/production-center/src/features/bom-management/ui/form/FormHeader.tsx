import { ArrowLeft, Edit, Save, Check } from "lucide-react";
import { AuthGuard, Button, Badge, ConfirmDialog, type FormPageMode } from "@base/ui";
import { StandardAction, useAbility } from "@base/authorization";
import { BomSubject, BomAction, BomField, type BomType } from "../../contract";

export interface FormHeaderProps {
	readonly mode: FormPageMode;
	readonly bomId?: string;
	readonly name: string;
	readonly initialPrimaryProductName?: string;
	readonly initialVersionName?: string;
	readonly isDefault: boolean;
	readonly bomType: BomType;
	readonly submitting: boolean;
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
	onSave,
	onCancel,
	onEdit,
}: FormHeaderProps) {
	const isView = mode === "view";
	const isEdit = mode === "edit";

	const ability = useAbility();
	const canReadName = ability.can("read", BomSubject, BomField.NAME);
	const displayName = canReadName ? (name || initialPrimaryProductName || initialVersionName) : initialPrimaryProductName;

	return (
		<div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b px-8 py-3.5 flex items-center justify-between shadow-xs">
			<div className="flex items-center gap-4">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={onCancel}
					className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-4" /> 返回
				</Button>
				<div className="h-4 w-px bg-border" />
				<div className="flex items-center gap-2">
					<span className="text-sm font-bold text-foreground">
						{isView
							? `BOM 方案详情: ${displayName || ""}`
							: isEdit
								? `编辑生产 BOM: ${displayName || ""}`
								: "新建生产 BOM"}
					</span>
					{isDefault && (
						<Badge
							variant="default"
							size="sm"
							className="bg-blue-600 hover:bg-blue-600 text-[10px] py-0 h-4 px-1.5"
						>
							默认BOM
						</Badge>
					)}
					<Badge
						variant="outline"
						size="sm"
						className="text-[10px] py-0 h-4 px-1.5"
					>
						{bomType === "PROCESSING"
							? "单品加工"
							: bomType === "FORMULA"
								? "组合配方"
								: "包装装配"}
					</Badge>
				</div>
			</div>

			<div className="flex items-center gap-2.5">
				{isView ? (
					<AuthGuard action={StandardAction.UPDATE} subject={BomSubject}>
						<Button
							type="button"
							size="sm"
							onClick={onEdit}
							className="h-8 text-xs gap-1.5"
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
							className="h-8 text-xs"
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
								className="h-8 text-xs gap-1.5 min-w-[80px]"
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
										className="h-8 text-xs gap-1.5 min-w-[88px] bg-blue-600 hover:bg-blue-700 text-white"
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
				)}
			</div>
		</div>
	);
}
