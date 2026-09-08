import React from "react";
import assert from "node:assert/strict";
import test from "node:test";
import { createMongoAbility } from "@casl/ability";
import { renderToStaticMarkup } from "react-dom/server";
import { createPermissionCatalog } from "./catalog";
import { AbilityContext, createReactAbilityAdapter } from "./react";

const permission = {
  resource: "test.order",
  subject: "TestOrder",
  actions: ["read", "audit"],
} as const;
const catalog = createPermissionCatalog([permission] as const);
const { Can, Permission } = createReactAbilityAdapter(catalog);

test("Permission and Can render from the same catalog-bound CASL provider", () => {
  const ability = createMongoAbility<
    [(typeof permission.actions)[number], typeof permission.subject]
  >([{ action: "read", subject: permission.subject }]);
  const html = renderToStaticMarkup(
    <AbilityContext value={ability}>
      <Permission action="read" subject={permission.subject}>
        <span>allowed</span>
      </Permission>
      <Permission action="audit" subject={permission.subject}>
        <span>denied</span>
      </Permission>
      <Can I="read" a={permission.subject}>
        <span>can</span>
      </Can>
    </AbilityContext>,
  );

  assert.match(html, /allowed/);
  assert.match(html, /can/);
  assert.doesNotMatch(html, /denied/);
});
