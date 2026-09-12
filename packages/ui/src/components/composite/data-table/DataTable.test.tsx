import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { DataTable } from "./index";
import type { ColumnDef } from "./DataTableContext";
import { resolveDefaultVisibleColumnIds } from "./DataTableContext";
import { DataTableRowActions } from "./DataTableRowActions";
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
    field: "price",
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
      <DataTable.FilterBar>
        <DataTable.InputGroup label="关键字">
          <input placeholder="搜索物料..." />
        </DataTable.InputGroup>
        <DataTable.FacetedFilter
          title="状态"
          options={[
            { label: "有货", value: "IN_STOCK" },
            { label: "缺货", value: "OUT_OF_STOCK" },
          ]}
        />
      </DataTable.FilterBar>
      <DataTable.Content />
      <DataTable.Pagination />
    </DataTable.Root>,
  );

  assert.match(html, /搜索物料\.\.\./);
  assert.match(html, /物料名称/);
  assert.match(html, /生鲜土豆/);
  assert.match(html, /冷冻鸡胸肉/);
  assert.match(html, /共/);
});

test("DataTable.Root: 默认一体化白卡容器，可关闭 integratedCard", () => {
  const cardHtml = renderToString(
    <DataTable.Root
      data={mockData}
      columns={mockColumns}
      rowKey={(item) => item.id}
    >
      <DataTable.Content />
    </DataTable.Root>,
  );
  assert.match(cardHtml, /rounded-xl/);
  assert.match(cardHtml, /bg-card/);

  const bareHtml = renderToString(
    <DataTable.Root
      data={mockData}
      columns={mockColumns}
      rowKey={(item) => item.id}
      integratedCard={false}
    >
      <DataTable.Content />
    </DataTable.Root>,
  );
  assert.doesNotMatch(
    bareHtml,
    /rounded-xl border border-border\/80 bg-card shadow-xs p-5/,
  );
});

test("DataTable.Header: 渲染分类小标、品牌竖条标题与说明文案", () => {
  const html = renderToString(
    <DataTable.Root
      data={mockData}
      columns={mockColumns}
      rowKey={(item) => item.id}
    >
      <DataTable.Header
        category="BUSINESS WORKSPACE"
        title="采购订单待办理"
        description="归集日采购、周采购和请购需求"
        actions={<span>操作区</span>}
      />
      <DataTable.Content />
    </DataTable.Root>,
  );

  assert.match(html, /BUSINESS WORKSPACE/);
  assert.match(html, /采购订单待办理/);
  assert.match(html, /归集日采购/);
  assert.match(html, /操作区/);
});

test("DataTable.FilterBar: 渲染查询/重置与高级筛选触发器及 InputGroup", () => {
  let searched = 0;
  let reset = 0;
  let advanced = 0;

  const html = renderToString(
    <DataTable.Root
      data={mockData}
      columns={mockColumns}
      rowKey={(item) => item.id}
    >
      <DataTable.FilterBar
        onSearch={() => {
          searched += 1;
        }}
        onReset={() => {
          reset += 1;
        }}
        onAdvancedFilter={() => {
          advanced += 1;
        }}
      >
        <DataTable.InputGroup label="关键字">
          <input placeholder="单号 / 名称" />
        </DataTable.InputGroup>
      </DataTable.FilterBar>
      <DataTable.Content />
    </DataTable.Root>,
  );

  assert.match(html, /关键字/);
  assert.match(html, /查询/);
  assert.match(html, /重置/);
  assert.match(html, /高级筛选/);
});

test("DataTable.Content showIndex: 渲染跨页自增序号列", () => {
  const html = renderToString(
    <DataTable.Root
      data={mockData}
      columns={mockColumns}
      rowKey={(item) => item.id}
      page={2}
      pageSize={2}
    >
      <DataTable.Content showIndex />
    </DataTable.Root>,
  );

  // page=2 pageSize=2 → 序号从 3 开始
  assert.match(html, />3</);
  assert.match(html, />4</);
  assert.doesNotMatch(html, />1</);
});

test("DataTable.Pagination: 渲染共 N 条、显示范围与数字页码", () => {
  const html = renderToString(
    <DataTable.Root
      data={mockData}
      columns={mockColumns}
      rowKey={(item) => item.id}
      page={2}
      pageSize={2}
      total={10}
    >
      <DataTable.Pagination />
    </DataTable.Root>,
  );

  assert.match(html, /共/);
  assert.match(html, /10/);
  assert.match(html, /显示第/);
  assert.match(html, /条\/页/);
});

test("DataTable.ColumnSettings: 命名空间存在且 lockVisible 解析正确", () => {
  assert.equal(typeof DataTable.ColumnSettings, "function");

  const cols: ColumnDef<TestItem>[] = [
    { id: "a", header: "A", cell: () => null, lockVisible: true },
    { id: "b", header: "B", cell: () => null, defaultVisible: false },
    { id: "c", header: "C", cell: () => null },
  ];
  const ids = resolveDefaultVisibleColumnIds(cols);
  assert.equal(ids.has("a"), true);
  assert.equal(ids.has("b"), false);
  assert.equal(ids.has("c"), true);
});

test("DataTable: 当无字段 read 权限时，自动隐藏对应列", () => {
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

  assert.match(html, /物料名称/);
  assert.match(html, /生鲜土豆/);
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

test("DataTable.Actions & ActionButton: 页面直接声明按钮，权限决定显隐", () => {
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
          <DataTableActionButton action="create">
            新建物料
          </DataTableActionButton>
          <DataTableActionButton action="export">
            导出报表
          </DataTableActionButton>
        </DataTableActions>
      </DataTable.Toolbar>
    </DataTable.Root>,
  );

  // 有权限：展示
  assert.match(html, /新建物料/);
  // 无权限：默认隐藏（普通用户 Fail-Closed）
  assert.doesNotMatch(html, /导出报表/);
});

test("DataTable.ActionButton: disabled-tooltip 策略置灰并提示", () => {
  const ability = {
    can() {
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
      <DataTableActionButton
        action="export"
        unauthorizedStrategy="disabled-tooltip"
        unauthorizedTooltip="暂无导出权限"
      >
        导出报表
      </DataTableActionButton>
    </DataTable.Root>,
  );

  assert.match(html, /导出报表/);
  assert.match(html, /暂无导出权限|opacity-50/);
});

test("DataTableRowActions: 默认平铺「详情/编辑」并折叠删除", () => {
  const ability = {
    can(action: string, subject: string) {
      if (subject === "Material" && action === "read") return true;
      if (subject === "Material" && action === "update") return true;
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
        onEdit={() => {}}
        onDelete={() => {}}
      />
    </DataTable.Root>,
  );

  assert.match(html, /详情/);
  assert.match(html, /编辑/);
  assert.match(html, /打开操作菜单/);
});

test("DataTableRowActions: 不传回调时默认仍展示内置操作（有权限无回调置灰）", () => {
  const ability = {
    can(action: string, subject: string) {
      if (subject === "Material" && action === "read") return true;
      if (subject === "Material" && action === "update") return true;
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
      <DataTableRowActions record={mockData[0]} />
    </DataTable.Root>,
  );

  assert.match(html, /详情/);
  assert.match(html, /编辑/);
  assert.match(html, /打开操作菜单/);
  assert.match(html, /opacity-50/);
});

test("DataTableRowActions: hideView/hideEdit/hideDelete 支持按需隐藏", () => {
  const ability = {
    can(action: string, subject: string) {
      if (subject === "Material" && action === "read") return true;
      if (subject === "Material" && action === "update") return true;
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
        onEdit={() => {}}
        onDelete={() => {}}
        hideView
        hideDelete
      />
    </DataTable.Root>,
  );

  assert.doesNotMatch(html, /详情/);
  assert.match(html, /编辑/);
  assert.doesNotMatch(html, /打开操作菜单/);
});

test("DataTableRowActions: 无 delete 权限时默认隐藏删除入口", () => {
  const ability = {
    can(action: string, subject: string) {
      if (subject === "Material" && action === "read") return true;
      if (subject === "Material" && action === "update") return true;
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
        onEdit={() => {}}
        onDelete={() => {}}
      />
    </DataTable.Root>,
  );

  assert.match(html, /详情/);
  assert.match(html, /编辑/);
  assert.doesNotMatch(html, /打开操作菜单/);
  assert.doesNotMatch(html, /删除记录/);
});

test("DataTable.AuthorizedField: 在 DataTable 内部自动继承父级权限与实体，且支持三态", () => {
  const ability = {
    can(action: string, subject: string, field?: string) {
      if (subject !== "Material") return false;
      if (field === "secretPrice") return false;
      if (field === "readonlyName" && action === "read") return true;
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
      <DataTable.AuthorizedField field="secretPrice" label="绝密采购成本">
        <input placeholder="秘密价格" />
      </DataTable.AuthorizedField>

      <DataTable.AuthorizedField field="readonlyName" label="受保护名称">
        <input placeholder="只读名称" />
      </DataTable.AuthorizedField>
    </DataTable.Root>,
  );

  assert.doesNotMatch(html, /绝密采购成本/);
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

test("DataTable.Workspace: 默认全量展示刷新/导出/列设置/新增与关键字筛选", () => {
  const ability = {
    can(action: string, subject: string) {
      if (
        subject === "Material" &&
        (action === "export" || action === "create")
      )
        return true;
      return false;
    },
  };

  const html = renderToString(
    <DataTable.Workspace
      data={mockData}
      columns={mockColumns}
      rowKey={(item) => item.id}
      subject="Material"
      ability={ability}
      title="物料档案"
      total={mockData.length}
      statusOptions={[
        { value: "IN_STOCK", label: "有货" },
        { value: "OUT_OF_STOCK", label: "缺货" },
      ]}
    />,
  );

  assert.match(html, /物料档案/);
  assert.match(html, /刷新/);
  assert.match(html, /导出/);
  assert.match(html, /列设置/);
  assert.match(html, /新增/);
  assert.match(html, /关键字/);
  assert.match(html, /物料名称/);
  assert.match(html, /共/);
});

test("DataTable.Workspace: show* 开关可关闭默认控件", () => {
  const html = renderToString(
    <DataTable.Workspace
      data={mockData}
      columns={mockColumns}
      rowKey={(item) => item.id}
      title="精简页"
      showRefresh={false}
      showExport={false}
      showCreate={false}
      showColumnSettings={false}
      showFilterBar={false}
      showPagination={false}
    />,
  );

  assert.match(html, /精简页/);
  assert.doesNotMatch(html, /刷新/);
  assert.doesNotMatch(html, /导出/);
  assert.doesNotMatch(html, /新增/);
  assert.doesNotMatch(html, /列设置/);
  assert.doesNotMatch(html, /关键字/);
});
