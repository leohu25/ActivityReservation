import {
	OperationListView,
	operationSearchParams,
} from "@domain/production-center/process-management";
import {
	getOperationFormOptionsQuery,
	listOperationsQuery,
} from "@domain/production-center/process-management/server";

interface OperationsPageProps {
	readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProductionOperationsPage({
	searchParams,
}: OperationsPageProps) {
	const parsed = await operationSearchParams.parse(searchParams);

	const [result, options] = await Promise.all([
		listOperationsQuery({
			page: parsed.page,
			pageSize: parsed.pageSize,
			keyword: String(parsed.keyword ?? "") || undefined,
			categoryId: String(parsed.categoryId ?? "") || undefined,
			status: String(parsed.status ?? "") || undefined,
		}),
		getOperationFormOptionsQuery(),
	]);

	return (
		<OperationListView
			data={result.items}
			total={result.total}
			options={options}
		/>
	);
}
