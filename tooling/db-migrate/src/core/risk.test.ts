import test from "node:test";
import assert from "node:assert/strict";
import { assertRiskApproval, detectMigrationRisks } from "./risk";

test("detectMigrationRisks detects destructive SQL", () => {
  const risks = detectMigrationRisks(
    'ALTER TABLE "customer" DROP COLUMN "legacy"; DROP TABLE "obsolete";',
  );
  assert.deepEqual(
    risks.map((risk) => risk.code),
    ["DROP_COLUMN", "DROP_TABLE"],
  );
});

test("assertRiskApproval rejects incomplete destructive approval", () => {
  const risks = detectMigrationRisks('DROP TABLE "obsolete";');
  assert.throws(() => assertRiskApproval(risks), /without a complete approval/);
  assert.doesNotThrow(() =>
    assertRiskApproval(risks, {
      reason: "Remove obsolete table",
      dataPlan: "Export required rows before deployment",
      rollbackPlan: "Restore the exported table if rollback is required",
    }),
  );
});
