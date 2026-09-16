import test from "node:test";
import assert from "node:assert/strict";
import { checkUiFile } from "./check-ui-permission-guards.mjs";

test("checkUiFile: 正常受控组件（使用 ActionButton）检测通过", () => {
  const content = `
    import { ActionButton } from "@base/ui";
    import { deleteCustomerAction } from "../actions";

    export function MyView() {
      return (
        <ActionButton action="delete" subject="Customer" onClick={deleteCustomerAction}>
          删除客户
        </ActionButton>
      );
    }
  `;
  const issues = checkUiFile(
    "src/features/customer/ui/CustomerView.tsx",
    content,
  );
  assert.equal(issues.length, 0, "使用 ActionButton 应完全通过检查");
});

test("checkUiFile: 调用了写操作 Action 但没有任何受控防线，精准报错拦截", () => {
  const content = `
    import { Button } from "@base/ui";
    import { deleteCustomerAction } from "../actions";

    export function MyView() {
      return (
        <Button onClick={() => deleteCustomerAction("1")}>
          普通按钮
        </Button>
      );
    }
  `;
  const issues = checkUiFile(
    "src/features/customer/ui/CustomerView.tsx",
    content,
  );
  assert.equal(issues.length, 1);
  assert.equal(issues[0].type, "MISSING_ACTION_GUARD");
});

test("checkUiFile: 裸渲染高危写操作按钮（如直接手写删除 Button），精准报错拦截", () => {
  const content = `
    import { Button } from "@base/ui";

    export function MyCustomCard() {
      return (
        <div>
          <Button onClick={() => alert("test")}>删除记录</Button>
        </div>
      );
    }
  `;
  const issues = checkUiFile(
    "src/features/customer/ui/CustomerCard.tsx",
    content,
  );
  assert.equal(issues.length, 1);
  assert.equal(issues[0].type, "RAW_DESTRUCTIVE_BUTTON");
});

test("checkUiFile: 属于 FormModal 或被 AuthGuard 包裹的高危按钮，合规放行", () => {
  const content = `
    import { Button, AuthGuard } from "@base/ui";

    export function MyCustomCard() {
      return (
        <AuthGuard action="delete" subject="Customer">
          <Button onClick={() => alert("test")}>删除记录</Button>
        </AuthGuard>
      );
    }
  `;
  const issues = checkUiFile(
    "src/features/customer/ui/CustomerCard.tsx",
    content,
  );
  assert.equal(issues.length, 0, "被 AuthGuard 包裹应判定合规通过");
});
