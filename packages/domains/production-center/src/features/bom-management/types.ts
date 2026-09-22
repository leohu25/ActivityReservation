export interface BomDto {
	readonly id: string;
	readonly currentPublishedVersionId?: string | null;
	readonly lifecycleStatus: string;
}

export interface BomVersionDto {
	readonly id: string;
	readonly bomId: string;
	readonly versionNumber: number;
	readonly versionStatus: string;
	readonly code: string;
	readonly name: string;
	readonly bomType: string;
}
