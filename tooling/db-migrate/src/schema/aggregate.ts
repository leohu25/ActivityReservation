import fs from "node:fs";
import path from "node:path";
import type { MigrationScope } from "../core/types";

interface SchemaBlock {
  readonly kind: "model" | "enum";
  readonly name: string;
  readonly sourcePath: string;
  readonly content: string;
  readonly extensionTarget?: string;
}

const TENANT_EXTENSION_PATTERN =
  /^\/\/\s*@db-migrate-extension\s+([A-Za-z0-9_]+)\s*$/m;

export function findSchemaFiles(
  workspaceRoot: string,
  scope: MigrationScope,
): string[] {
  if (scope === "platform") {
    return [
      path.join(workspaceRoot, "packages/base/db-control/prisma/schema.prisma"),
    ];
  }

  const files = [
    path.join(workspaceRoot, "packages/base/db-tenant/prisma/schema.prisma"),
  ];
  const scanDirs = [
    path.join(workspaceRoot, "packages/domains"),
    path.join(workspaceRoot, "packages/platform"),
  ];
  for (const dir of scanDirs) {
    if (fs.existsSync(dir)) {
      for (const entry of fs
        .readdirSync(dir, { withFileTypes: true })
        .sort((a, b) => a.name.localeCompare(b.name))) {
        if (!entry.isDirectory()) continue;
        const schemaPath = path.join(dir, entry.name, "prisma/schema.prisma");
        if (fs.existsSync(schemaPath)) files.push(schemaPath);
      }
    }
  }
  return files;
}

function extractBlocks(sourcePath: string, schema: string): SchemaBlock[] {
  const blocks: SchemaBlock[] = [];
  const pattern =
    /((?:(?:^[ \t]*\/\/[^\n]*\n)|(?:^[ \t]*\/\/\/[^\n]*\n))*)[ \t]*(model|enum)\s+([A-Za-z0-9_]+)\s*\{([\s\S]*?)\n\}/gm;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(schema)) !== null) {
    const comments = match[1] ?? "";
    const kind = match[2] as "model" | "enum";
    const name = match[3];
    const content = `${comments}${kind} ${name} {${match[4]}\n}`;
    const extensionTarget = TENANT_EXTENSION_PATTERN.exec(comments)?.[1];
    blocks.push({ kind, name, sourcePath, content, extensionTarget });
  }
  return blocks;
}

function parseModelBody(block: string): {
  readonly fields: Map<string, string>;
  readonly attributes: Set<string>;
} {
  const body = /model\s+[A-Za-z0-9_]+\s*\{([\s\S]*)\}$/.exec(block)?.[1];
  if (body === undefined)
    throw new Error(`Invalid Prisma model block: ${block}`);
  const fields = new Map<string, string>();
  const attributes = new Set<string>();
  for (const rawLine of body.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("//")) continue;
    if (line.startsWith("@@")) {
      attributes.add(line);
      continue;
    }
    const fieldName = line.split(/\s+/, 1)[0];
    if (fieldName) fields.set(fieldName, line);
  }
  return { fields, attributes };
}

function mergeExtension(owner: string, extension: SchemaBlock): string {
  const modelName = extension.name;
  const ownerBody = parseModelBody(owner);
  const extensionBody = parseModelBody(extension.content);

  for (const [fieldName, line] of extensionBody.fields) {
    const ownerLine = ownerBody.fields.get(fieldName);
    if (ownerLine && ownerLine !== line) {
      const ownerTokens = ownerLine.split(/\s+/);
      const extensionTokens = line.split(/\s+/);
      const sameFieldContract =
        ownerTokens[0] === extensionTokens[0] &&
        ownerTokens[1] === extensionTokens[1];
      if (!sameFieldContract) {
        throw new Error(
          `Schema extension conflict for ${modelName}.${fieldName} in ${extension.sourcePath}`,
        );
      }
    }
    if (!ownerLine) ownerBody.fields.set(fieldName, line);
  }
  for (const attribute of extensionBody.attributes) {
    ownerBody.attributes.add(attribute);
  }

  const lines = [
    ...[...ownerBody.fields.values()].map((line) => `  ${line}`),
    ...[...ownerBody.attributes].map((line) => `  ${line}`),
  ];
  return `model ${modelName} {\n${lines.join("\n")}\n}`;
}

function canonicalHeader(): string {
  return `// Generated canonical schema. Do not edit directly.\ndatasource db {\n  provider = "postgresql"\n}\n\ngenerator client {\n  provider = "prisma-client-js"\n}\n`;
}

export function buildCanonicalSchema(
  workspaceRoot: string,
  scope: MigrationScope,
): string {
  const blocks = findSchemaFiles(workspaceRoot, scope).flatMap((sourcePath) =>
    extractBlocks(sourcePath, fs.readFileSync(sourcePath, "utf-8")),
  );
  const owners = new Map<string, SchemaBlock>();
  const extensions: SchemaBlock[] = [];

  for (const block of blocks) {
    if (block.extensionTarget) {
      if (block.kind !== "model" || block.extensionTarget !== block.name) {
        throw new Error(
          `Invalid schema extension declaration for ${block.name} in ${block.sourcePath}`,
        );
      }
      extensions.push(block);
      continue;
    }
    const key = `${block.kind}:${block.name}`;
    const existing = owners.get(key);
    if (existing) {
      throw new Error(
        `Duplicate ${block.kind} owner ${block.name}: ${existing.sourcePath} and ${block.sourcePath}`,
      );
    }
    owners.set(key, block);
  }

  for (const extension of extensions) {
    const key = `model:${extension.name}`;
    const owner = owners.get(key);
    if (!owner) {
      throw new Error(
        `Schema extension ${extension.name} has no owner (${extension.sourcePath})`,
      );
    }
    owners.set(key, {
      ...owner,
      content: mergeExtension(owner.content, extension),
    });
  }

  const enums = [...owners.values()]
    .filter((block) => block.kind === "enum")
    .sort((a, b) => a.name.localeCompare(b.name));
  const models = [...owners.values()]
    .filter((block) => block.kind === "model")
    .sort((a, b) => a.name.localeCompare(b.name));

  return [
    canonicalHeader(),
    ...enums.map((b) => b.content),
    ...models.map((b) => b.content),
  ].join("\n\n");
}
