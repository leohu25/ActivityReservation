#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function findWorkspaceRoot(startDir = process.cwd()) {
	let curr = path.resolve(startDir);
	while (curr !== path.dirname(curr)) {
		if (fs.existsSync(path.join(curr, "pnpm-workspace.yaml"))) {
			return curr;
		}
		curr = path.dirname(curr);
	}
	return path.resolve(process.cwd());
}

const root = findWorkspaceRoot(import.meta.dirname);
const scanRoots = [
	path.join(root, "packages/domains"),
	path.join(root, "packages/platform"),
];
const contractPattern = /contract\.ts$/;
const tsPattern = /\.(?:ts|tsx)$/;
const manifestPattern = /\/manifest\.ts$/;

function filesUnderRoots(predicate) {
	return scanRoots.flatMap((r) => filesUnder(r, predicate));
}
const resourcePattern = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;
const subjectPattern = /^[A-Z][A-Za-z0-9]*$/;
const actionPattern = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
const fieldPattern = /^[a-z][A-Za-z0-9]*$/;
const pageKeyPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/;
const violations = [];

function lineOf(source, index) {
	return source.slice(0, index).split("\n").length;
}
function fail(file, index, dimension, rule, found, expected) {
	violations.push({
		file: path.relative(root, file),
		line: lineOf(fs.readFileSync(file, "utf8"), index),
		dimension,
		rule,
		found,
		expected,
	});
}

function filesUnder(dir, predicate) {
	if (!fs.existsSync(dir)) return [];
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	const results = [];
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === "node_modules" || entry.name === "dist") continue;
			results.push(...filesUnder(full, predicate));
		} else if (predicate(full)) {
			results.push(full);
		}
	}
	return results;
}

function prismaModels() {
	const models = new Map();
	for (const file of filesUnder(
		path.join(root, "packages"),
		(f) => f.endsWith(".prisma") && !f.endsWith("schema.generated.prisma"),
	)) {
		const source = fs.readFileSync(file, "utf8");
		for (const match of source.matchAll(
			/\bmodel\s+(\w+)\s*\{([\s\S]*?)\n\}/g,
		)) {
			const fields = new Set();
			for (const line of match[2].split("\n")) {
				const field = line.match(/^\s*(\w+)\s+[A-Za-z]/)?.[1];
				if (field) fields.add(field);
			}
			const existing = models.get(match[1]);
			if (existing) {
				for (const field of fields) existing.fields.add(field);
			} else {
				models.set(match[1], { file, fields });
			}
		}
	}
	return models;
}

const models = prismaModels();
const contractFiles = filesUnderRoots((f) => /contract\.ts$/.test(f));
const allTsFiles = filesUnderRoots((f) => /\.(?:ts|tsx)$/.test(f));
const subjects = new Map();
const resources = new Map();
const fieldsByName = new Map();
const descriptors = new Map();
const descriptorSubjects = new Set();
const allowedCapabilitySubjects = new Set([
	"ControlMigration",
	"ControlOverview",
	"ControlTenant",
	"AuditLogOperation",
	"AuditLogLogin",
	"AuditLogPermission",
	"RoleManagement",
	"Role",
	"Employee",
	"Workbench",
	"GeneralSettings",
	"SecuritySettings",
]);

for (const file of contractFiles) {
	const source = fs.readFileSync(file, "utf8");
	for (const match of source.matchAll(
		/export const (\w+Subject)\s*=\s*"([^"]+)"\s*;/g,
	)) {
		const [, name, value] = match;
		subjects.set(name, { value, file, index: match.index });
		if (!subjectPattern.test(value))
			fail(
				file,
				match.index,
				"权限主体命名",
				"大驼峰命名规范 (PascalCase)",
				value,
				"必须使用 PascalCase 规范命名（例如 ItemMaster）",
			);
		if (!models.has(value) && !allowedCapabilitySubjects.has(value)) {
			fail(
				file,
				match.index,
				"权限主体映射",
				"Prisma 物理实体映射或白名单能力异常",
				value,
				"必须映射至真实的 Prisma 数据模型，或在 allowedCapabilitySubjects 白名单中显式声明为非实体业务能力",
			);
		}
	}
	for (const match of source.matchAll(
		/export const (\w+Subject)\s*=\s*(\w+Subject)\s*;/g,
	)) {
		const aliasName = match[1];
		const targetName = match[2];
		fail(
			file,
			match.index,
			"权限主体声明",
			"独立主体声明规范",
			`${aliasName} = ${targetName}`,
			"严禁声明 Subject 别名兼容层，必须为每个业务实体独立声明规范的 PascalCase Subject 常量",
		);
	}
	for (const match of source.matchAll(
		/export const (\w+Resource)\s*=\s*"([^"]+)"\s*;/g,
	)) {
		const [, name, value] = match;
		resources.set(name, { value, file, index: match.index });
		if (!resourcePattern.test(value))
			fail(
				file,
				match.index,
				"资源标识命名",
				"<领域>.<单数资源> 小写下划线规范",
				value,
				"必须遵循 <domain>.<singular_resource> 小写下划线命名（例如 customer.store 或 material.item_master）",
			);
	}
	for (const match of source.matchAll(
		/export const (\w+Field)\s*=\s*\{([\s\S]*?)\}\s*as const/g,
	)) {
		const [, dictionaryName, body] = match;
		const values = [];
		for (const valueMatch of body.matchAll(
			/\b[A-Z][A-Z0-9_]*\s*:\s*"([^"]+)"/g,
		)) {
			values.push(valueMatch[1]);
			if (!fieldPattern.test(valueMatch[1]))
				fail(
					file,
					match.index + valueMatch.index,
					"受控字段命名",
					"小驼峰命名规范 (camelCase)",
					valueMatch[1],
					"字段值必须为符合 Prisma 属性定义的小驼峰命名（例如 referencePrice）",
				);
		}
		fieldsByName.set(dictionaryName, { values, file, index: match.index });
	}
	for (const match of source.matchAll(
		/export const (\w+PageContract)(?:\s*:\s*FeaturePagePermissionDescriptor)?\s*=\s*\{([\s\S]*?)\n\s*\}(?:\s*as const)?\s*;/g,
	)) {
		const [, name, body] = match;
		const resource = body.match(/\bresource:\s*(\w+Resource)\b/)?.[1];
		const subject = body.match(/\bsubject:\s*(\w+Subject)\b/)?.[1];
		const contractPath = body.match(/\bpath:\s*"([^"]+)"/)?.[1];
		if (!resource)
			fail(
				file,
				match.index,
				"资源绑定规范",
				"页面契约常量引用",
				body.match(/\bresource:\s*([^,\n]+)/)?.[1] ?? "未声明",
				"必须通过常量引用声明: resource: XxxResource",
			);
		if (!subject)
			fail(
				file,
				match.index,
				"权限主体绑定",
				"页面契约常量引用",
				body.match(/\bsubject:\s*([^,\n]+)/)?.[1] ?? "未声明",
				"必须通过常量引用声明: subject: XxxSubject",
			);
		for (const action of body.matchAll(/\baction:\s*"([^"]+)"/g)) {
			fail(
				file,
				match.index + action.index,
				"权限动作声明",
				"已声明的常量引用",
				action[1],
				"严禁裸写动词字符串，必须使用 StandardAction.X 或 DomainAction.X",
			);
		}
		descriptors.set(name, {
			file,
			resource,
			subject,
			path: contractPath,
			index: match.index,
		});
		if (subject) descriptorSubjects.add(subject);
	}
	for (const match of source.matchAll(/(?:action|ACTION)\s*:\s*"([^"]+)"/g)) {
		if (!actionPattern.test(match[1]))
			fail(
				file,
				match.index,
				"权限动作动词",
				"小写下划线动词规范 (snake_case)",
				match[1],
				"动作动词必须为小写下划线格式（例如 read, update, audit, submit_review）",
			);
	}
}

for (const [name, item] of subjects) {
	if (!descriptorSubjects.has(name)) {
		fail(
			item.file,
			item.index,
			"授权链条覆盖",
			"主体页面契约覆盖 (Subject descriptor coverage)",
			name,
			`请在该切片中导出 FeaturePagePermissionDescriptor，将 ${name} 显式绑定至对应的 Resource 页面契约`,
		);
	}
}

const resourceValues = new Map();
for (const [name, item] of resources) {
	const prior = resourceValues.get(item.value);
	if (prior && prior !== name)
		fail(
			item.file,
			item.index,
			"资源唯一性",
			"全局唯一资源标识 (global uniqueness)",
			item.value,
			`资源标识全局唯一；该值已被 ${prior} 先行占用`,
		);
	resourceValues.set(item.value, name);
}

for (const [fieldName, item] of fieldsByName) {
	const expectedSubject = fieldName.replace(/Field$/, "Subject");
	const subject = subjects.get(expectedSubject)?.value;
	if (!subject) continue;

	// 非实体能力（allowedCapabilitySubjects）豁免 Prisma 物理模型对齐校验
	if (allowedCapabilitySubjects.has(subject)) continue;

	// 针对领域模型聚合投影视图进行主子表模型聚合
	// Bom 字段聚合自 Bom + BomVersion
	const compositeModels = {
		Bom: ["Bom", "BomVersion"],
	};

	const targetModelNames = compositeModels[subject] || [subject];
	const aggregatedFields = new Set();
	for (const mName of targetModelNames) {
		const m = models.get(mName);
		if (m) {
			for (const f of m.fields) aggregatedFields.add(f);
		}
	}

	// 允许部分虚拟计算字段或跨关联聚合字段
	const virtualFieldExceptions = {
		Bom: new Set(["productId", "status", "isDefault"]),
		CompanyProfile: new Set(["systemName", "logoUrl"]),
	};
	const allowedVirtualFields = virtualFieldExceptions[subject] || new Set();

	for (const value of item.values) {
		if (!aggregatedFields.has(value) && !allowedVirtualFields.has(value))
			fail(
				item.file,
				item.index,
				"字段物理映射",
				`Prisma 模型字段对齐 (${subject})`,
				value,
				`该受控字段在 Prisma 模型 ${targetModelNames.join(" / ")} 中不存在，请确认模型字段定义`,
			);
	}
}

for (const file of filesUnderRoots((f) => f.endsWith("/manifest.ts"))) {
	const source = fs.readFileSync(file, "utf8");
	for (const match of source.matchAll(/pageKey:\s*"([^"]+)"/g)) {
		const value = match[1];
		if (!pageKeyPattern.test(value)) {
			fail(
				file,
				match.index,
				"页面键规范",
				"小写中划线规范 (kebab-case)",
				value,
				"pageKey 必须使用至少包含一个连字符的小写中划线字符串（例如 customer-stores 或 system-workbench）",
			);
		}
	}
	for (const match of source.matchAll(/requiredAction:\s*"([^"]+)"/g))
		fail(
			file,
			match.index,
			"权限动作声明",
			"Manifest 常量引用规范",
			match[1],
			"必须使用 StandardAction 常量引用: requiredAction: StandardAction.X",
		);
	const pageBlock =
		source.match(/permissionModules:\s*\[([\s\S]*?)\n\s*\],?\n\};/)?.[1] ?? "";
	for (const descriptor of descriptors.keys()) {
		if (
			source.includes(descriptor) &&
			/PageContract$/.test(descriptor) &&
			!pageBlock.includes(descriptor)
		) {
			fail(
				file,
				source.indexOf(descriptor),
				"授权链条覆盖",
				"Manifest 页面契约消费 (manifest descriptor consumption)",
				descriptor,
				`请在 manifest 的 permissionModules.pages 数组中显式包含 ${descriptor}`,
			);
		}
	}

	// 复合页面多实体校验：若同一切片多个 PageContract 共享同一 path，manifest.pages 中对应页面必须显式声明 subjects 数组
	const manifestDir = path.dirname(file);
	const featureDescriptors = Array.from(descriptors.entries()).filter(
		([, d]) => d.file.startsWith(manifestDir) && d.path,
	);
	const pathGroups = new Map();
	for (const [, d] of featureDescriptors) {
		const list = pathGroups.get(d.path) || [];
		list.push(d);
		pathGroups.set(d.path, list);
	}

	for (const [routePath, group] of pathGroups) {
		if (group.length > 1) {
			const expectedSubjects = group.map((g) => g.subject);
			const hasRouteInPages = source.includes(`href: "${routePath}"`);
			if (hasRouteInPages) {
				// 确保声明了 subjects: [ ... ] 并且涵盖对应实体
				const pagesBlock =
					source.match(/pages:\s*\[([\s\S]*?)\n\s*\],/)?.[1] ?? "";
				const hasSubjectsDecl = pagesBlock.includes("subjects:");
				if (!hasSubjectsDecl) {
					fail(
						file,
						source.indexOf(`href: "${routePath}"`),
						"复合页面配置",
						"多权限主体显式声明 (multiple subjects declaration)",
						`href: "${routePath}" 缺少 subjects: [...]`,
						`复合路由匹配多个页面契约时，必须显式声明 subjects: [${expectedSubjects.join(", ")}]`,
					);
				}
			}
		}
	}
}

for (const file of allTsFiles) {
	// 排除测试用例与契约本身
	if (
		file.endsWith(".test.ts") ||
		file.endsWith(".test.tsx") ||
		file.endsWith("contract.ts")
	)
		continue;
	const source = fs.readFileSync(file, "utf8");
	for (const match of source.matchAll(
		/assert\w*Ability\(\s*[^,]+,\s*["']([^"']+)["']\s*,\s*([^,)]+)/g,
	)) {
		fail(
			file,
			match.index,
			"权限动作声明",
			"assertAbility 动作常量引用",
			match[1],
			"严禁裸写动词字符串，必须使用 StandardAction.X 或 DomainAction.X",
		);
	}
	for (const match of source.matchAll(
		/assert\w*Ability\(\s*[^,]+,\s*[^,]+,\s*["']([^"']+)["']/g,
	)) {
		fail(
			file,
			match.index,
			"权限主体声明",
			"assertAbility 主体常量引用",
			match[1],
			"严禁裸写主体字符串，必须使用已导出的 XxxSubject 常量",
		);
	}
	for (const match of source.matchAll(/ability\.can\(\s*["']([^"']+)["']/g)) {
		fail(
			file,
			match.index,
			"权限动作声明",
			"ability.can 动作常量引用",
			match[1],
			"严禁裸写动词字符串，必须使用 StandardAction.X 或 DomainAction.X",
		);
	}
	for (const match of source.matchAll(/\baction=["']([^"']+)["']/g)) {
		fail(
			file,
			match.index,
			"组件权限守卫",
			"Guard 动作常量引用",
			match[1],
			"严禁裸写动作，必须使用 action={StandardAction.X} 或 action={DomainAction.X}",
		);
	}
	for (const match of source.matchAll(
		/ability\.can\([\s\S]{0,180}?,\s*["']([a-z][A-Za-z0-9]*)["']\s*\)/g,
	)) {
		fail(
			file,
			match.index,
			"受控字段声明",
			"ability.can 字段常量引用",
			match[1],
			"严禁裸写字段名，必须使用已导出的 XxxField.X 常量",
		);
	}

	// 严禁在 assert*Ability 守卫函数声明中将 action 或 subject 降级为宽泛的 string 类型
	for (const match of source.matchAll(
		/export function (assert\w*Ability)\s*\([^)]*?\baction\s*:\s*string[^)]*?\)/gs,
	)) {
		fail(
			file,
			match.index,
			"类型安全红线",
			"强类型 Action 联合类型约束 (禁止降级为 string)",
			match[1],
			"守卫函数的 action 参数必须声明强类型联合类型，严禁使用 string",
		);
	}
	for (const match of source.matchAll(
		/export function (assert\w*Ability)\s*\([^)]*?\bsubject\s*:\s*string[^)]*?\)/gs,
	)) {
		fail(
			file,
			match.index,
			"类型安全红线",
			"强类型 Subject 联合类型约束 (禁止降级为 string)",
			match[1],
			"守卫函数的 subject 参数必须声明强类型联合类型，严禁使用 string",
		);
	}
}

// ---------------------------------------------------------------------------
// 架构红线：外键字典与下拉选项解耦门禁 (Contextual Options Architecture Redline)
// 1. 业务列表页面 (非分类标签管理自身) 严禁直接调用管理端专属的 getCategoryTreeQuery，必须消费宿主 Options Query
// ---------------------------------------------------------------------------
const tenantDashboardPages = filesUnder(
	path.join(root, "apps/tenant/src/app/(dashboard)"),
	(f) => f.endsWith("page.tsx"),
);

for (const file of tenantDashboardPages) {
	const rel = path.relative(root, file).replace(/\\/g, "/");
	// 排除分类管理自身页面
	if (rel.includes("customer/categories")) continue;

	const source = fs.readFileSync(file, "utf8");
	for (const match of source.matchAll(/\b(getCategoryTreeQuery)\b/g)) {
		fail(
			file,
			match.index,
			"选项架构解耦",
			"业务页面严禁直调管理端 TreeQuery",
			match[1],
			"必须消费宿主专用的 get*PageOptionsQuery（例如 getCustomerPageOptionsQuery）而不是直调分类树管理接口",
		);
	}
}

// ---------------------------------------------------------------------------
// 架构红线：消灭 Subject 魔法字符串门禁 (Zero Magic String Subjects Redline)
// 严禁在 getTenantSubjectPermissions 或 getTenantMultiSubjectPermissions 中传入裸字符串字面量
// ---------------------------------------------------------------------------
const tenantAppFiles = filesUnder(
	path.join(root, "apps/tenant/src"),
	(f) => tsPattern.test(f) && !f.endsWith(".test.ts") && !f.endsWith(".test.tsx"),
);

for (const file of tenantAppFiles) {
	const source = fs.readFileSync(file, "utf8");

	// 拦截 getTenantSubjectPermissions("MagicString")
	for (const match of source.matchAll(
		/getTenantSubjectPermissions\(\s*["']([A-Za-z0-9_]+)["']\s*\)/g,
	)) {
		fail(
			file,
			match.index,
			"权限主体安全",
			"getTenantSubjectPermissions 严禁魔法字符串",
			match[1],
			`必须从对应切片 contract 中导入 ${match[1]}Subject 常量符号并传入`,
		);
	}

	// 拦截 getTenantMultiSubjectPermissions(["MagicString1", ...])
	for (const match of source.matchAll(
		/getTenantMultiSubjectPermissions\(\s*\[\s*([\s\S]*?)\s*\]\s*\)/g,
	)) {
		const arrayBody = match[1];
		for (const strMatch of arrayBody.matchAll(/["']([A-Za-z0-9_]+)["']/g)) {
			fail(
				file,
				match.index + (strMatch.index ?? 0),
				"权限主体安全",
				"getTenantMultiSubjectPermissions 数组严禁魔法字符串",
				strMatch[1],
				`必须从对应切片 contract 中导入 ${strMatch[1]}Subject 常量符号并传入`,
			);
		}
	}
}

if (violations.length) {
	console.error(
		`\u001b[31m✗ 【权限四维与契约规范门禁检测失败】发现 ${violations.length} 项违规：\u001b[0m`,
	);
	for (const v of violations) {
		console.error(
			`  \u001b[33m${v.file}:${v.line}\u001b[0m [${v.dimension}] ${v.rule}`,
		);
		console.error(`    实际代码: ${String(v.found).trim().slice(0, 160)}`);
		console.error(`    整改建议: ${v.expected}`);
	}
	process.exit(1);
}
console.log(
	"✓ 权限契约四维规范（Resource/Subject/Action/Field）与单一事实源校验通过",
);
