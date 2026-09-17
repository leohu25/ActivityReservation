"use client";

import type { ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
	SheetFooter,
	SheetClose,
} from "../ui/sheet";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

export interface DataTableFilterDrawerProps {
	/** 抽屉主标题，默认 "高级检索与筛选" */
	title?: string;
	/** 描述说明 */
	description?: string;
	/** 触发按钮文字，默认 "更多筛选" */
	triggerText?: string;
	/** 当前已激活的高级筛选条件数量，非 0 时在按钮上展示小红点或微标 */
	activeCount?: number;
	/** 点击重置按钮回调 */
	onReset?: () => void;
	/** 点击确定查询回调 */
	onApply?: () => void;
	/** 抽屉受控状态 */
	open?: boolean;
	/** 抽屉受控状态变更 */
	onOpenChange?: (open: boolean) => void;
	/** 抽屉表单内容 */
	children: ReactNode;
	className?: string;
}

export function DataTableFilterDrawer({
	title = "高级检索与筛选",
	description = "配置更多维度的业务条件，精准定位数据记录。",
	triggerText = "更多筛选",
	activeCount = 0,
	onReset,
	onApply,
	open,
	onOpenChange,
	children,
	className,
}: DataTableFilterDrawerProps) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetTrigger
				render={
					<Button
						variant="outline"
						size="sm"
						className={cn(
							"h-8 border-dashed border-border/80 text-xs font-normal gap-1.5 px-2.5",
							className,
						)}
					/>
				}
			>
				<SlidersHorizontal className="size-3.5 text-muted-foreground" />
				<span>{triggerText}</span>
				{activeCount > 0 && (
					<Badge
						variant="default"
						className="size-4 p-0 text-[10px] rounded-full justify-center ml-0.5"
					>
						{activeCount}
					</Badge>
				)}
			</SheetTrigger>
			<SheetContent className="sm:max-w-md flex flex-col justify-between">
				<div>
					<SheetHeader className="pb-4 border-b border-border/60">
						<SheetTitle className="text-base font-semibold">{title}</SheetTitle>
						{description && (
							<SheetDescription className="text-xs text-muted-foreground">
								{description}
							</SheetDescription>
						)}
					</SheetHeader>
					<div className="flex flex-col gap-4 py-4">{children}</div>
				</div>
				<SheetFooter className="pt-4 border-t border-border/60 flex sm:justify-between gap-2">
					{onReset && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={onReset}
							className="text-xs text-muted-foreground"
						>
							重置全部条件
						</Button>
					)}
					<div className="flex items-center gap-2">
						<SheetClose
							render={
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="text-xs"
								/>
							}
						>
							取消
						</SheetClose>
						{onApply ? (
							<SheetClose
								render={
									<Button
										type="button"
										size="sm"
										className="text-xs"
										onClick={onApply}
									/>
								}
							>
								应用筛选
							</SheetClose>
						) : null}
					</div>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
