#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const featureRoot = path.join(root, "packages/features");
const resourcePattern = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;
const subjectPattern = /^[A-Z][A-Za-z0-9]*$/;
const actionPattern = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
const fieldPattern = /^[a-z][A-Za-z0-9]*$/;
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
function filesUnder(directory, predicate) {
  const files = [];
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const resolved = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...filesUnder(resolved, predicate));
    else if (predicate(resolved)) files.push(resolved);
  }
  return files;
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
const contractFiles = filesUnder(featureRoot, (f) => /contract\.ts$/.test(f));
const allTsFiles = filesUnder(featureRoot, (f) => /\.(?:ts|tsx)$/.test(f));
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
        "subject",
        "PascalCase",
        value,
        "PascalCase such as ItemMaster",
      );
    if (!models.has(value) && !allowedCapabilitySubjects.has(value)) {
      fail(
        file,
        match.index,
        "subject",
        "entity mapping or bounded capability exception",
        value,
        "a real Prisma model or an explicitly allowed non-entity capability",
      );
    }
  }
  for (const match of source.matchAll(
    /export const (\w+Subject)\s*=\s*(\w+Subject)\s*;/g,
  )) {
    const aliasName = match[1];
    const targetName = match[2];
    const explicitlyDeprecated = source
      .slice(Math.max(0, match.index - 120), match.index)
      .includes("@deprecated");
    if (!explicitlyDeprecated) {
      fail(
        file,
        match.index,
        "subject",
        "independent declaration",
        `${aliasName} = ${targetName}`,
        "declare an independent PascalCase subject, or mark a compatibility alias @deprecated",
      );
    }
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
        "resource",
        "<domain>.<singular_resource> lowercase snake_case",
        value,
        "for example customer.store or material.item_master",
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
          "field",
          "camelCase",
          valueMatch[1],
          "a camelCase Prisma field such as referencePrice",
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
    if (!resource)
      fail(
        file,
        match.index,
        "resource",
        "descriptor constant reference",
        body.match(/\bresource:\s*([^,\n]+)/)?.[1] ?? "missing",
        "resource: XxxResource",
      );
    if (!subject)
      fail(
        file,
        match.index,
        "subject",
        "descriptor constant reference",
        body.match(/\bsubject:\s*([^,\n]+)/)?.[1] ?? "missing",
        "subject: XxxSubject",
      );
    for (const action of body.matchAll(/\baction:\s*"([^"]+)"/g)) {
      fail(
        file,
        match.index + action.index,
        "action",
        "declared constant reference",
        action[1],
        "StandardAction.X or DomainAction.X",
      );
    }
    descriptors.set(name, { file, resource, subject, index: match.index });
    if (subject) descriptorSubjects.add(subject);
  }
  for (const match of source.matchAll(/(?:action|ACTION)\s*:\s*"([^"]+)"/g)) {
    if (!actionPattern.test(match[1]))
      fail(
        file,
        match.index,
        "action",
        "lowercase snake_case verb",
        match[1],
        "read, update, audit, submit_review, etc.",
      );
  }
}

for (const [name, item] of subjects) {
  if (!descriptorSubjects.has(name)) {
    fail(
      item.file,
      item.index,
      "authorization-chain",
      "Subject descriptor coverage",
      name,
      `export a FeaturePagePermissionDescriptor that explicitly binds ${name} to its Resource`,
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
      "resource",
      "global uniqueness",
      item.value,
      `a unique resource key; already declared by ${prior}`,
    );
  resourceValues.set(item.value, name);
}

for (const [fieldName, item] of fieldsByName) {
  const expectedSubject = fieldName.replace(/Field$/, "Subject");
  const subject = subjects.get(expectedSubject)?.value;
  const model = subject ? models.get(subject) : undefined;
  if (!model) continue;
  for (const value of item.values) {
    if (!model.fields.has(value))
      fail(
        item.file,
        item.index,
        "field",
        `Prisma alignment for ${subject}`,
        value,
        `a field declared on Prisma model ${subject}`,
      );
  }
}

for (const file of filesUnder(featureRoot, (f) => f.endsWith("/manifest.ts"))) {
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(/requiredAction:\s*"([^"]+)"/g))
    fail(
      file,
      match.index,
      "action",
      "manifest constant reference",
      match[1],
      "requiredAction: StandardAction.X",
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
        "authorization-chain",
        "manifest descriptor consumption",
        descriptor,
        `include ${descriptor} in permissionModules.pages`,
      );
    }
  }
}

for (const file of allTsFiles) {
  // Tests may use literal permission fixtures; production authorization call sites may not.
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
      "action",
      "assert constant reference",
      match[1],
      "StandardAction.X or DomainAction.X",
    );
  }
  for (const match of source.matchAll(
    /assert\w*Ability\(\s*[^,]+,\s*[^,]+,\s*["']([^"']+)["']/g,
  )) {
    fail(
      file,
      match.index,
      "subject",
      "assert constant reference",
      match[1],
      "a declared XxxSubject constant",
    );
  }
  for (const match of source.matchAll(/ability\.can\(\s*["']([^"']+)["']/g)) {
    fail(
      file,
      match.index,
      "action",
      "ability.can constant reference",
      match[1],
      "StandardAction.X or DomainAction.X",
    );
  }
  for (const match of source.matchAll(/\baction=["']([^"']+)["']/g)) {
    fail(
      file,
      match.index,
      "action",
      "guard constant reference",
      match[1],
      "action={StandardAction.X} or action={DomainAction.X}",
    );
  }
  for (const match of source.matchAll(
    /ability\.can\([\s\S]{0,180}?,\s*["']([a-z][A-Za-z0-9]*)["']\s*\)/g,
  )) {
    fail(
      file,
      match.index,
      "field",
      "ability.can field constant reference",
      match[1],
      "a declared XxxField.X constant",
    );
  }
}

if (violations.length) {
  console.error(
    `\u001b[31m✗ [Permission Contract Violations] found ${violations.length} violation(s)\u001b[0m`,
  );
  for (const v of violations) {
    console.error(
      `  \u001b[33m${v.file}:${v.line}\u001b[0m [${v.dimension}] ${v.rule}`,
    );
    console.error(`    found: ${String(v.found).trim().slice(0, 160)}`);
    console.error(`    fix:   ${v.expected}`);
  }
  process.exit(1);
}
console.log(
  "✓ Permission contracts satisfy Resource/Subject/Action/Field SSoT rules",
);
