import test from "node:test";
import assert from "node:assert/strict";
import { getMigrationCatalog } from "./catalog";

for (const scope of ["platform", "tenant"] as const) {
  test(`${scope} runtime catalog embeds the reviewed baseline`, () => {
    const catalog = getMigrationCatalog(scope);
    assert.equal(catalog.scope, scope);
    assert.notEqual(catalog.baseline.version, "0");
    assert.match(catalog.baseline.sql, /CREATE TABLE/);
    assert.ok(catalog.baseline.checksum.length > 0);
  });
}
