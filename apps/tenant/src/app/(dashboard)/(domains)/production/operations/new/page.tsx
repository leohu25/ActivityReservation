import { OperationFormPage } from "@domain/production-center/process-management";
import { getOperationFormOptionsQuery } from "@domain/production-center/process-management/server";

export default async function NewOperationPage() {
	const options = await getOperationFormOptionsQuery();

	return <OperationFormPage options={options} />;
}
