import {
	StandardAction,
	type TenantFeatureManifest,
} from "@base/authorization";
import {
	TenantDictItemSubject,
	tenantDictItemPageContract,
} from "./features/dict/contract";

export const baseArchivesManifest: TenantFeatureManifest = {
	id: "base-archives",
	name: "基础档案",
	pages: [
		{
			pageKey: "base-archives-dict",
			defaultLabel: "数据字典",
			group: "基础档案",
			href: "/archives/dict",
			defaultIcon: "BookOpen",
			requiredAction: StandardAction.READ,
			requiredSubject: TenantDictItemSubject,
		},
	],
	permissionModules: [
		{
			moduleKey: "base-archives",
			label: "基础档案",
			iconName: "Archive",
			order: 25,
			pages: [tenantDictItemPageContract],
		},
	],
};
