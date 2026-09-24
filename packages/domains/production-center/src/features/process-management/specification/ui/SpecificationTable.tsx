"use client";

import { useMemo } from "react";
import { DetailTable } from "@base/ui";
import { MasterDataStatus } from "@base/shared";
import { createSpecificationColumns } from "./specificationColumns";
import type { ProcessingSpecificationInput } from "../types";

export interface SpecificationTableProps {
	readonly specifications: readonly ProcessingSpecificationInput[];
	readonly onChange: (
		specs: readonly ProcessingSpecificationInput[],
	) => void;
	readonly disabled?: boolean;
	readonly isView?: boolean;
}

/**
 * 工艺规格明细表格组件 (基于统一高阶 DetailTable)
 */
export function SpecificationTable({
	specifications,
	onChange,
	disabled = false,
	isView = false,
}: SpecificationTableProps) {
	const columns = useMemo(
		() => createSpecificationColumns({ isView }),
		[isView],
	);

	return (
		<DetailTable<ProcessingSpecificationInput>
			columns={columns}
			data={specifications}
			onChange={onChange}
			onAddRow={() => ({
				code: `SPEC_${String(specifications.length + 1).padStart(2, "0")}`,
				name: "",
				defaultYieldRate: null,
				description: "",
				status: MasterDataStatus.ACTIVE,
			})}
			addText="添加规格"
			readOnly={isView || disabled}
			emptyText="暂无工艺规格明细"
		/>
	);
}
