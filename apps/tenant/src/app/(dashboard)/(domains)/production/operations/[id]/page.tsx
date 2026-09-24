import { notFound } from "next/navigation";
import { OperationFormPage } from "@domain/production-center/process-management";
import {
	getOperationDetailQuery,
	getOperationFormOptionsQuery,
} from "@domain/production-center/process-management/server";

interface OperationDetailPageProps {
	readonly params: Promise<{ id: string }>;
	readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function OperationDetailPage({
	params,
	searchParams,
}: OperationDetailPageProps) {
	const { id } = await params;
	const sp = await searchParams;
	const isView = sp.mode === "view";

	const [detail, options] = await Promise.all([
		getOperationDetailQuery(id),
		getOperationFormOptionsQuery(),
	]);

	if (!detail) {
		notFound();
	}

	return (
		<OperationFormPage
			initialDetail={detail}
			options={options}
			isView={isView}
		/>
	);
}
