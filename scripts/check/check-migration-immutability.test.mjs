import test from "node:test";
import assert from "node:assert/strict";
import {
  findImmutableMigrationViolations,
  isProtectedMigrationArtifact,
  parseNameStatus,
} from "./check-migration-immutability.mjs";

test("isProtectedMigrationArtifact - 仅保护迁移与基线目录", () => {
  assert.equal(
    isProtectedMigrationArtifact(
      "tooling/db-migrate/migrations/tenant/20260915035330_add/migration.sql",
    ),
    true,
  );
  assert.equal(
    isProtectedMigrationArtifact(
      "tooling/db-migrate/baselines/platform/20260913150000/baseline.sql",
    ),
    true,
  );
  assert.equal(
    isProtectedMigrationArtifact(
      "tooling/db-migrate/generated/runtime-catalog.ts",
    ),
    false,
  );
});

test("parseNameStatus - 解析新增、修改、删除与重命名", () => {
  const changes = parseNameStatus(
    [
      "A\ttooling/db-migrate/migrations/tenant/new/migration.sql",
      "M\ttooling/db-migrate/migrations/tenant/old/migration.sql",
      "D\ttooling/db-migrate/baselines/tenant/old/baseline.sql",
      "R100\ttooling/db-migrate/migrations/tenant/old/manifest.json\ttooling/db-migrate/migrations/tenant/new/manifest.json",
    ].join("\n"),
  );

  assert.deepEqual(changes, [
    {
      status: "A",
      similarity: null,
      oldPath: null,
      path: "tooling/db-migrate/migrations/tenant/new/migration.sql",
    },
    {
      status: "M",
      similarity: null,
      oldPath: null,
      path: "tooling/db-migrate/migrations/tenant/old/migration.sql",
    },
    {
      status: "D",
      similarity: null,
      oldPath: null,
      path: "tooling/db-migrate/baselines/tenant/old/baseline.sql",
    },
    {
      status: "R",
      similarity: "100",
      oldPath: "tooling/db-migrate/migrations/tenant/old/manifest.json",
      path: "tooling/db-migrate/migrations/tenant/new/manifest.json",
    },
  ]);
});

test("findImmutableMigrationViolations - 允许新增迁移，阻止修改和删除历史", () => {
  const changes = parseNameStatus(
    [
      "A\ttooling/db-migrate/migrations/tenant/new/migration.sql",
      "A\ttooling/db-migrate/migrations/tenant/new/manifest.json",
      "M\ttooling/db-migrate/migrations/tenant/old/migration.sql",
      "D\ttooling/db-migrate/baselines/tenant/old/baseline.sql",
      "M\ttooling/db-migrate/generated/runtime-catalog.ts",
    ].join("\n"),
  );

  const violations = findImmutableMigrationViolations(changes);
  assert.deepEqual(
    violations.map((change) => `${change.status}:${change.path}`),
    [
      "M:tooling/db-migrate/migrations/tenant/old/migration.sql",
      "D:tooling/db-migrate/baselines/tenant/old/baseline.sql",
    ],
  );
});

test("findImmutableMigrationViolations - 阻止重命名历史，允许复制为新增工件", () => {
  const changes = parseNameStatus(
    [
      "R100\ttooling/db-migrate/migrations/tenant/old/migration.sql\tarchive/migration.sql",
      "C100\ttooling/db-migrate/baselines/tenant/old/baseline.sql\tbackup/baseline.sql",
    ].join("\n"),
  );

  const violations = findImmutableMigrationViolations(changes);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].status, "R");
});
