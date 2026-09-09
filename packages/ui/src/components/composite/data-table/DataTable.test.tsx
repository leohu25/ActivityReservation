import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { DataTable } from "./index";
import type { ColumnDef } from "./DataTableContext";
import { DataTableRowActions } from "./DataTableRowActions";
import { DataTableDetailDrawer } from "./DataTableDetailDrawer";
import { DataTableFormModal } from "./DataTableFormModal";
import { DataTableActions, DataTableActionButton } from "./DataTableActions";

interface TestItem {
  id: string;
  name: string;
  price: number;
  status: string;
}

const mockData: TestItem[] = [
  { id: "1", name: "生鲜土豆", price: 15.5, status: "IN_STOCK" },
  { id: "2", name: "冷冻鸡胸肉", price: 28.0, status: "OUT_OF_STOCK" },
];

const mockColumns: ColumnDef<TestItem>[] = [
  {
    id: "name",
    header: "物料名称",
    cell: (item) => item.name,
  },
  {
    id: "price",
    header: "采购单价",
    field: "price", // 受控字段
    cell: (item) => `¥${item.price}`,
  },
  {
    id: "status",
    header: "库存状态",
    cell: (item) => item.status,
  },
];

test("DataTable: 能够像积木一样自由装配并正确渲染表格主体与工具栏", () => {
  const html = renderToString(
    <DataTable.Root
      data={mockData}
      columns={mockColumns}
      rowKey={(item) => item.id}
      total={mockData.length}
    >
      <DataTable.Toolbar>
        <DataTable.Search placeholder="搜索物料..." />
        <DataTable.FacetedFilter
          title="状态"
          options={[
            { label: "有货", value: "IN_STOCK" },
            { label: "缺货", value: "OUT_OF_STOCK" },
          ]}
        />
      </DataTable.Toolbar>
      <DataTable.Content />
      <DataTable.Pagination />
    </DataTable.Root>,
  );

  // 验证搜索框占位符存在
  assert.match(html, /搜索物料\.\.\./);
  // 验证表头和数据内容存在
  assert.match(html, /物料名称/);
  assert.match(html, /生鲜土豆/);
  assert.match(html, /冷冻鸡胸肉/);
  // 验证分页信息存在
  assert.match(html, /共/);
  assert.match(html, /条记录/);
});

test("DataTable: 当无字段 read 权限时，自动隐藏对应列", () => {
  // 模拟 CASL ability: 拒绝读取 price 字段
  const ability = {
    can(action: string, _subject: string, field?: string) {
      if (action === "read" && field === "price") {
        return false;
      }
      return true;
    },
  };

  const html = renderToString(
    <DataTable.Root
      data={mockData}
      columns={mockColumns}
      rowKey={(item) => item.id}
      subject="Material"
      ability={ability}
    >
      <DataTable.Content />
    </DataTable.Root>,
  );

  // 能够读取 name 列
  assert.match(html, /物料名称/);
  assert.match(html, /生鲜土豆/);
  // 无法读取 price 列（表头和金额都不应被渲染）
  assert.doesNotMatch(html, /采购单价/);
  assert.doesNotMatch(html, /¥15\.5/);
});

test("DataTable: 当数据为空时，能够优雅展示 EmptyState 空状态", () => {
  const html = renderToString(
    <DataTable.Root data={[]} columns={mockColumns} rowKey={(item) => item.id}>
      <DataTable.Content />
    </DataTable.Root>,
  );

  assert.match(html, /暂无数据/);
});

test("DataTable.DetailDrawer: 能够正确渲染详情查看抽屉与自定义内容插槽", () => {
  const selectedRecord = mockData[0];
  const html = renderToString(
    <DataTableDetailDrawer
      record={selectedRecord}
      onClose={() => {}}
      inline={true}
      title={(r) => `物料详情: ${r.name}`}
      description="包含规格与采购定价"
    >
      {(r) => (
        <div data-testid="detail-content">
          <span>编号: {r.id}</span>
          <span>价格: ¥{r.price}</span>
        </div>
      )}
    </DataTableDetailDrawer>,
  );

  assert.match(html, /物料详情: 生鲜土豆/);
  assert.match(html, /包含规格与采购定价/);
  assert.match(html, /编号:.*1/);
  assert.match(html, /价格:.*¥.*15\.5/);
});

test("DataTable.FormModal: 能够正确渲染编辑/新建表单弹窗插槽", () => {
  const targetRecord = mockData[1];
  const html = renderToString(
    <DataTableFormModal
      open={true}
      onOpenChange={() => {}}
      inline={true}
      record={targetRecord}
      onSubmit={() => {}}
      title={(r) => (r ? `编辑物料: ${r.name}` : "新建物料")}
      description="修改库存与定价信息"
      submitText="保存更改"
    >
      {({ record }) => (
        <div>
          <label>当前名称: {record?.name}</label>
          <label>当前库存: {record?.status}</label>
        </div>
      )}
    </DataTableFormModal>,
  );

  assert.match(html, /编辑物料: 冷冻鸡胸肉/);
  assert.match(html, /修改库存与定价信息/);
  assert.match(html, /当前名称:.*冷冻鸡胸肉/);
  assert.match(html, /保存更改/);
});

test("DataTable.Actions & ActionButton: 支持自定义顶部操作插槽与权限自动判定", () => {
  const ability = {
    can(action: string, subject: string) {
      if (subject === "Material" && action === "create") return true;
      if (subject === "Material" && action === "export") return false;
      return false;
    },
  };

  const html = renderToString(
    <DataTable.Root
      data={mockData}
      columns={mockColumns}
      rowKey={(item) => item.id}
      subject="Material"
      ability={ability}
    >
      <DataTable.Toolbar>
        <DataTableActions>
          {({ can }) => (
            <>
              {can("create") && (
                <DataTableActionButton action="create">
                  新建物料
                </DataTableActionButton>
              )}
              {/* export 无权限，默认 hidden 策略自动隐藏 */}
              <DataTableActionButton action="export">
                导出报表
              </DataTableActionButton>
            </>
          )}
        </DataTableActions>
      </DataTable.Toolbar>
    </DataTable.Root>,
  );

  // create 有权限，应成功渲染
  assert.match(html, /新建物料/);
  // export 无权限，应被自动过滤隐藏
  assert.doesNotMatch(html, /导出报表/);
});

test("DataTableRowActions: 支持自定义行级操作插槽与删除二次确认", () => {
  const ability = {
    can(action: string, subject: string) {
      if (subject === "Material" && action === "read") return true;
      if (subject === "Material" && action === "delete") return true;
      return false;
    },
  };

  const html = renderToString(
    <DataTable.Root
      data={mockData}
      columns={mockColumns}
      rowKey={(item) => item.id}
      subject="Material"
      ability={ability}
    >
      <DataTableRowActions
        record={mockData[0]}
        onView={() => {}}
        onDelete={() => {}}
        extraActions={[
          {
            label: "自定义盘点",
            onClick: () => {},
          },
        ]}
      />
    </DataTable.Root>,
  );

  // 渲染操作触发按钮
  assert.match(html, /打开操作菜单/);
});

test("DataTable.AuthorizedField: 在 DataTable 内部自动继承父级权限与实体，且支持三态", () => {
  const ability = {
    can(action: string, subject: string, field?: string) {
      if (subject !== "Material") return false;
      if (field === "secretPrice") return false; // 隐藏
      if (field === "readonlyName" && action === "read") return true; // 只读
      if (field === "readonlyName" && action === "update") return false;
      return true;
    },
  };

  const html = renderToString(
    <DataTable.Root
      data={mockData}
      columns={mockColumns}
      rowKey={(item) => item.id}
      subject="Material"
      ability={ability}
    >
      {/* 字段 1：无 read 权限，自动 HIDDEN */}
      <DataTable.AuthorizedField field="secretPrice" label="绝密采购成本">
        <input placeholder="秘密价格" />
      </DataTable.AuthorizedField>

      {/* 字段 2：有 read 无 update 权限，自动 READONLY 并打上只读徽标 */}
      <DataTable.AuthorizedField field="readonlyName" label="受保护名称">
        <input placeholder="只读名称" />
      </DataTable.AuthorizedField>
    </DataTable.Root>,
  );

  // 绝密字段被自动剥离隐藏
  assert.doesNotMatch(html, /绝密采购成本/);
  // 只读字段被渲染并带有只读标签和 disabled 属性
  assert.match(html, /受保护名称/);
  assert.match(html, /只读/);
  assert.match(html, /disabled/);
});

test("DataTable.AuthGuard: 依据 CASL 权限自动控制自定义插槽块的渲染与隐藏", () => {
  const ability = {
    can(action: string, subject: string) {
      if (subject === "Material" && action === "batch-audit") return true;
      return false;
    },
  };

  const html = renderToString(
    <DataTable.Root
      data={mockData}
      columns={mockColumns}
      rowKey={(item) => item.id}
      subject="Material"
      ability={ability}
    >
      <DataTable.AuthGuard action="batch-audit">
        <div data-testid="allowed-slot">批量审核专区</div>
      </DataTable.AuthGuard>

      <DataTable.AuthGuard action="dangerous-wipe">
        <div data-testid="denied-slot">高危清库操作</div>
      </DataTable.AuthGuard>
    </DataTable.Root>,
  );

  assert.match(html, /批量审核专区/);
  assert.doesNotMatch(html, /高危清库操作/);
});
