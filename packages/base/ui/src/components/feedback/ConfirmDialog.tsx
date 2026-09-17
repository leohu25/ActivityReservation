"use client";

import type * as React from "react";
import { type ReactNode, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

export interface ConfirmDialogProps {
	/** 触发弹窗的元素，如删除按钮 */
	trigger?: React.ReactElement;
	/** 弹窗标题 */
	title: string;
	/** 详细警告说明 */
	description?: string;
	/** 确认按钮文字，默认 "确定" */
	confirmText?: string;
	/** 取消按钮文字，默认 "取消" */
	cancelText?: string;
	/** 按钮变体：默认高危 'destructive' */
	variant?: "destructive" | "default";
	/** 点击确认后的回调，支持异步 Promise（执行中会自动显示 loading） */
	onConfirm: () => void | Promise<void>;
	/** 受控开关状态 */
	open?: boolean;
	/** 受控开关状态变更 */
	onOpenChange?: (open: boolean) => void;
	children?: ReactNode;
}

export function ConfirmDialog({
	trigger,
	title,
	description,
	confirmText = "确定",
	cancelText = "取消",
	variant = "destructive",
	onConfirm,
	open: controlledOpen,
	onOpenChange: setControlledOpen,
	children,
}: ConfirmDialogProps) {
	const [internalOpen, setInternalOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	const isControlled = controlledOpen !== undefined;
	const open = isControlled ? controlledOpen : internalOpen;
	const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

	const handleConfirm = async () => {
		try {
			setLoading(true);
			await onConfirm();
			setOpen(false);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{trigger && <DialogTrigger render={trigger} />}
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="flex items-center gap-2">
						{variant === "destructive" && (
							<div className="flex size-9 items-center justify-center rounded-full bg-destructive/10 text-destructive shrink-0">
								<AlertTriangle className="size-5" />
							</div>
						)}
						<DialogTitle className="text-base font-semibold">
							{title}
						</DialogTitle>
					</div>
					{description && (
						<DialogDescription className="pt-2 text-xs leading-relaxed text-muted-foreground">
							{description}
						</DialogDescription>
					)}
				</DialogHeader>
				{children && <div className="py-2">{children}</div>}
				<DialogFooter className="mt-4 flex sm:justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => setOpen(false)}
						disabled={loading}
					>
						{cancelText}
					</Button>
					<Button
						type="button"
						variant={variant}
						size="sm"
						onClick={handleConfirm}
						disabled={loading}
					>
						{loading && <Loader2 className="size-3.5 animate-spin mr-1" />}
						{confirmText}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
