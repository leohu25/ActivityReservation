import test from "node:test";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { UiAbilityProvider, type UiAbilityLike } from "./ui-ability-context";
import { ActionButton } from "./ActionButton";
import { ActionGroup } from "./ActionGroup";

function createMockAbility(allowedActions: readonly string[]): UiAbilityLike {
  return {
    can: (action: string, subject: any) => {
      if (subject === "MockSubject") {
        return allowedActions.includes(action);
      }
      return false;
    },
  };
}

test("ActionButton: 无权限时物理不渲染 DOM", () => {
  const ability = createMockAbility(["read"]);
  const html = renderToString(
    <UiAbilityProvider ability={ability}>
      <ActionButton action="create" subject="MockSubject">
        新建按钮
      </ActionButton>
    </UiAbilityProvider>,
  );

  assert.equal(
    html,
    "",
    "无 create 权限时 ActionButton 应该物理不输出任何 DOM",
  );
});

test("ActionButton: 具有权限时正常渲染并携带样式", () => {
  const ability = createMockAbility(["create"]);
  const html = renderToString(
    <UiAbilityProvider ability={ability}>
      <ActionButton action="create" subject="MockSubject">
        新建按钮
      </ActionButton>
    </UiAbilityProvider>,
  );

  assert.match(html, /新建按钮/, "有 create 权限时应正常渲染");
  assert.match(html, /<button/, "应渲染为 button 原语");
});

test("ActionGroup: 批量传入操作时自动过滤无权限操作项", () => {
  const ability = createMockAbility(["read", "update"]);
  const html = renderToString(
    <UiAbilityProvider ability={ability}>
      <ActionGroup
        subject="MockSubject"
        actions={[
          { action: "create", label: "新建操作", onClick: () => {} },
          { action: "update", label: "编辑操作", onClick: () => {} },
          { action: "delete", label: "删除操作", onClick: () => {} },
        ]}
      />
    </UiAbilityProvider>,
  );

  assert.doesNotMatch(html, /新建操作/, "无 create 权限应过滤新建");
  assert.match(html, /编辑操作/, "有 update 权限应展示编辑");
  assert.doesNotMatch(html, /删除操作/, "无 delete 权限应过滤删除");
});
