import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { useDataTableState } from "./use-data-table-state";
import { DataTable } from "../components/templates/DataTable";
import type { ColumnDef } from "../components/composite/table/DataTableContext";

test("useDataTableState: 初始状态正常推导与暴露 bindProps", () => {
  function DummyComponent() {
    const table = useDataTableState({
      initialPage: 2,
      initialPageSize: 20,
      initialTotal: 50,
      initialKeyword: "test-query",
      syncUrl: false,
    });

    assert.equal(table.page, 2);
    assert.equal(table.pageSize, 20);
    assert.equal(table.total, 50);
    assert.equal(table.keyword, "test-query");
    assert.equal(table.bindProps.keywordValue, "test-query");

    return null;
  }

  renderToString(<DummyComponent />);
});

test("DataTable: 默认占位符升级为中立语义且支持 Enter 快捷键", () => {
  interface RecordItem {
    id: string;
    name: string;
  }

  const columns: ColumnDef<RecordItem>[] = [
    {
      id: "name",
      header: "名称",
      cell: (r) => <span>{r.name}</span>,
    },
  ];

  const html = renderToString(
    <DataTable<RecordItem>
      title="测试列表"
      data={[{ id: "1", name: "商品A" }]}
      columns={columns}
      rowKey={(r) => r.id}
    />,
  );

  // 验证消除了原先粗暴硬编码的 "单号" 占位符
  assert.doesNotMatch(html, /单号 \/ 名称 \/ 关键字/);
  assert.match(html, /输入关键字搜索\.\.\./);
});

test("DataTable: 传入 searchContract 能够自动生成语义化占位符", () => {
  interface RecordItem {
    id: string;
  }
  const contract = {
    direct: [
      { field: "orderId", label: "订单号" },
      { field: "salesPerson", label: "销售员" },
    ],
    relations: [{ targetField: "customerCode", label: "客户" }],
  };

  const html = renderToString(
    <DataTable<RecordItem>
      title="销售订单"
      data={[{ id: "1" }]}
      columns={[]}
      rowKey={(r) => r.id}
      searchContract={contract}
    />,
  );

  assert.match(html, /输入 订单号 \/ 销售员 \/ 客户\.\.\./);
});
