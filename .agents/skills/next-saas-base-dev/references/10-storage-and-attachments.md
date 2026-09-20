# 模块 10：对象存储、图片上传与多态附件标准范式 (Storage & Attachments Paradigm)

在企业级多租户 SaaS ERP 体系中，文件上传与存储必须严格兼顾**多租户数据物理隔离**、**零服务器带宽内存消耗（客户端直传）**与**业务解耦的中台化管理**。

---

## 一、 多租户对象存储架构与标准规范 (@base/storage)

### 1. 统一 S3 兼容协议与环境自适应
全系统基于标准 AWS S3 兼容协议构建，抹平本地与云端差异：
- **本地开发 / 私有化部署**：一键启动本地 **MinIO**（`docker-compose.storage.yml`）；
- **公有云生产环境**：无缝切换至 **阿里云 OSS**、**腾讯云 COS** 或 **AWS S3**，业务代码零修改，仅凭 `.env` 环境变量驱动。

### 2. 租户物理路径强隔离规范 (Tenant Isolation Path)
严禁将不同租户的文件混杂存放，对象存储路径 Key 必须严格采用租户前缀强隔离：
```text
tenants/{tenantId}/{module}/{yyyy}/{mm}/{uuid}.{ext}
例如:
tenants/org_001/employee/2026/09/ac4dbabeb72546c4868a1c71585ec2e5.jpg
tenants/org_001/customer/2026/09/98fb2e71d36a49fa8a23bb6189cf0012.pdf
```
- **文件名 UUID 化**：防止不同用户上传同名文件相互覆盖，并杜绝公网爬虫按序号遍历文件；
- **原始文件名留存**：业务所需的中文原始名称由数据库元数据字段保管。

### 3. 客户端预签名直传机制 (Presigned URL)
- **【铁律】严禁使用 Node.js / Next.js 服务端中转上传大文件**（极易触发 413 请求体溢出，并严重挤占服务器入网/出网带宽与内存）；
- **标准直传链路**：
  1. 浏览器向服务端请求预签名凭证（校验租户身份与文件白名单）；
  2. 服务端调用 `@base/storage` 生成 10 分钟有时效的 PUT 预签名 URL；
  3. 浏览器携带二进制文件直接向 MinIO / OSS 发起 `HTTP PUT`，实现零服务器负载直传；
  4. 上传完成后，将文件的公开访问 URL 或附件元数据随业务表单提交保存。

---

## 二、 两类文件存储模式的设计决策矩阵 (Decision Matrix)

在业务切片落地时，根据业务场景二选一，切忌混淆或盲目建表：

| 维度 | 模式 A：轻量单值字段（主表存 URL） | 模式 B：通用多态附件中心（写入 `sys_attachment`） |
| :--- | :--- | :--- |
| **典型场景** | 实体 1:1 展示性图片：用户/员工证件头像 (`avatarUrl`)、企业组织 Logo (`logoUrl`)、物料商品封面主图 (`coverUrl`) | 实体 1:N 复杂文件/单据列表：员工档案（劳动合同、学历证明、体检报告）、采购/销售订单（电子发票、送货单回执）、客户中心（营业执照、商务协议） |
| **存储载体** | 直接在业务主表定义 `avatarUrl String?` 标量字段 | 统一存入租户库全局唯一的 `sys_attachment` 表 |
| **建表要求** | 仅需在主表增加一个字段，**严禁建子表** | **全系统复用单张附件表**，通过 `(module, targetId)` 多态定位 |
| **原始文件名** | 不需要保留原名（展示图片不涉及下载） | **严格保留原始中文名**，供用户点击下载时还原文件名 |
| **读取成本** | 零联表成本，随主实体一并读取（性能最高） | 仅在详情页或附件抽屉中按 `targetId` 独立联查 |

---

## 三、 通用多态附件表建模规范 (`sys_attachment`)

全系统无论演进出几十还是上百个垂直业务切片，**全仓仅维护一张通用的多态附件表**，严禁为各个业务私造 `xxx_attachment`：

```prisma
/// 通用业务附件元数据模型 (Tenant DB 物理隔离，严格对齐 ADR-009 实体审计基线)
model Attachment {
  /// 附件主键ID
  id          String    @id @default(cuid()) @db.VarChar(36)
  
  // --- 多态关联定位三要素 ---
  /// 归属业务模块名 (如 "employee", "customer", "order")
  module      String    @db.VarChar(50)
  /// 关联业务实体主键ID (动态逻辑外键，如员工档案ID、订单ID)
  targetId    String?   @map("target_id") @db.VarChar(64)
  /// 细分业务槽位 (可选，如 "contract", "license", "invoice")
  fieldKey    String?   @map("field_key") @db.VarChar(50)

  // --- 文件元数据 ---
  /// 原始文件名 (用户上传时的名称，下载时还原)
  fileName    String    @map("file_name") @db.VarChar(255)
  /// 对象存储内部 Key (tenants/{tenantId}/...)
  storageKey  String    @map("storage_key") @db.VarChar(500)
  /// 访问或下载 URL
  fileUrl     String    @map("file_url") @db.VarChar(1000)
  /// 文件大小 (字节，用于配额与用量计算)
  fileSize    BigInt    @map("file_size")
  /// MIME 类型 (用于前端根据类型渲染 PDF/Excel/图片 图标)
  mimeType    String    @map("mime_type") @db.VarChar(100)

  // --- 8大基础审计与软删除字段 (ADR-009 基线) ---
  createdById String    @default("system") @map("created_by_id") @db.VarChar(64)
  deptId      String?   @map("dept_id") @db.VarChar(64)
  updatedById String?   @map("updated_by_id") @db.VarChar(64)
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  isDeleted   Boolean   @default(false) @map("is_deleted")
  deletedAt   DateTime? @map("deleted_at")
  deletedById String?   @map("deleted_by_id") @db.VarChar(64)

  @@index([targetId, module])
  @@index([createdById])
  @@map("sys_attachment")
}
```

---

## 四、 存储安全防护与校验铁律

1. **强类型 MIME 白名单校验**：
   - 图片上传仅放行常见位图：`image/jpeg`、`image/png`、`image/webp`、`image/gif`；
   - **【安全红线】严禁放行 `image/svg+xml`**（SVG 文件支持内嵌 `<script>` 标签，直接公网渲染会引发严重存储型 XSS 漏洞）；
   - **禁止高危后缀**：服务端校验清洗扩展名，硬拦截 `.html`、`.htm`、`.exe`、`.sh`、`.php`、`.js`；
2. **文件容量物理限额**：
   - 证件与头像图片：单文件上限一般设为 5MB ~ 10MB；
   - 单据与普通附件：单文件上限一般设为 20MB ~ 50MB；
   - 服务端预签名接口必须前置校验 `fileSize`，防止超限文件申请上传凭证。

---

## 五、 UI 组件集成与表单规范 (@base/ui)

### 1. 单图上传模式 (`FormFieldSchema` type: "image")
在 `FormModal` 中声明字段时，可直接使用内置的 `type: "image"` 字段控件：

```tsx
// 业务表单字段声明
const fields: FormFieldSchema[] = [
  {
    name: "avatarUrl",
    label: "员工证件头像",
    type: "image",
    module: "employee",
    maxSizeMB: 10,
    disabled: isView,
    onUploadAction: getUploadPresignedUrlAction,
    span: 2,
  },
];
```

### 2. 多附件列表模式交互流程与完整落地方案 (端到端实战模板)

在需要多附件关联的复杂业务单据（如合同扫描件、发票附件、质检报告）中，必须严格遵循**两阶段上传**与**高效批量查询**规范：

#### ① 写入链路：前端暂存 ➔ 服务端事务原子入库 (`service.ts`)
新建业务单据时，实体 ID 尚未生成。前端直传 MinIO 成功后在表单中暂存附件元数据数组，保存单据时在事务内先生成主业务主键，再批量绑定写入 `sys_attachment`：

```ts
export class ResourceService {
  /**
   * 创建业务单据并原子绑定多个附件 (事务保证)
   */
  static async createResourceWithAttachments(
    client: TenantPrismaClient,
    input: CreateResourceInput,
    auditCtx: { userId: string; deptId: string | null },
  ) {
    return client.$transaction(async (tx) => {
      // 1. 创建主单据获取真实 targetId
      const record = await tx.resource.create({
        data: {
          name: input.name,
          createdById: auditCtx.userId,
          deptId: auditCtx.deptId,
        },
      });

      // 2. 批量将本次上传的附件挂载到该主单据 (一对多关联，0 中间表)
      if (input.attachments && input.attachments.length > 0) {
        await tx.attachment.createMany({
          data: input.attachments.map((att) => ({
            module: "resource",             // 锁定当前业务模块
            targetId: record.id,            // 绑定刚生成的主业务 ID
            fieldKey: att.fieldKey || "default", // 槽位：如 contract/invoice/report
            fileName: att.fileName,         // 原始中文文件名
            storageKey: att.storageKey,     // 存储内部 Key
            fileUrl: att.fileUrl,           // 访问 URL
            fileSize: BigInt(att.fileSize), // 字节体积
            mimeType: att.mimeType,
            createdById: auditCtx.userId,
            deptId: auditCtx.deptId,
          })),
        });
      }

      return record;
    });
  }
}
```

#### ② 读取链路 A：【列表页】批量加载附件（严禁 N+1 循环查询）(`queries.ts`)
在业务列表分页（如一页 20 条）需要展示附件统计或缩略图时，必须采用 **“主表分页 + 单次 IN 批量查附件 + 内存 Map 聚合”** 的高性能范式，仅需 2 次轻量 SQL：

```ts
import "server-only";
import { toPlainData, resolvePagination } from "@base/shared";

export async function listResourcesPagedQuery(filter: ListFilter) {
  const { client } = await getTenantDbContext();
  const { page, pageSize, skip, take } = resolvePagination(filter);

  // 1. 第一步：分页查出当页业务数据
  const [total, items] = await Promise.all([
    client.resource.count({ where: { isDeleted: false } }),
    client.resource.findMany({
      where: { isDeleted: false },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (items.length === 0) {
    return toPlainData({ items: [], total: 0, page, pageSize });
  }

  // 2. 第二步：提取主键数组，发一条 IN 索引查询拉取所有关联附件 (避免 N+1)
  const targetIds = items.map((r) => r.id);
  const attachments = await client.attachment.findMany({
    where: {
      module: "resource",
      targetId: { in: targetIds },
      isDeleted: false,
    },
    select: {
      id: true,
      targetId: true,
      fieldKey: true,
      fileName: true,
      fileUrl: true,
      fileSize: true,
      mimeType: true,
    },
  });

  // 3. 第三步：在内存中按 targetId 构建高效 Map 索引 (O(N) 性能)
  const attachmentMap = new Map<string, typeof attachments>();
  for (const att of attachments) {
    if (!att.targetId) continue;
    const list = attachmentMap.get(att.targetId) || [];
    list.push(att);
    attachmentMap.set(att.targetId, list);
  }

  // 4. 第四步：组装最终前端消费 DTO (带附件数量与快速预览图)
  const finalItems = items.map((record) => {
    const files = attachmentMap.get(record.id) || [];
    return {
      ...record,
      attachments: files,
      attachmentCount: files.length,
      coverUrl: files.find((f) => f.fieldKey === "cover")?.fileUrl || null,
    };
  });

  return toPlainData({ items: finalItems, total, page, pageSize });
}
```

#### ③ 读取链路 B：【详情页/抽屉】单据附件查询 (`queries.ts`)
详情页展示完整的附件明细列表，直接利用 `(module, targetId)` 复合索引极速返回：

```ts
export async function getResourceDetailQuery(id: string) {
  const { client } = await getTenantDbContext();

  // 并发查询单据详情与附件列表
  const [detail, attachments] = await Promise.all([
    client.resource.findUniqueOrThrow({ where: { id } }),
    client.attachment.findMany({
      where: {
        module: "resource",
        targetId: id,
        isDeleted: false,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return toPlainData({
    ...detail,
    attachments,
  });
}
```

#### ④ 前端渲染：消费组件与 DataTable 列呈现
- **列表页呈现**：在表格列中直接展示附件徽章或图片缩略图：
  ```tsx
  {
    header: "附件资料",
    cell: (row) => (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Paperclip className="size-3.5" />
        <span>{row.attachmentCount > 0 ? `${row.attachmentCount} 份` : "无"}</span>
      </div>
    ),
  }
  ```
- **详情页呈现**：利用 `@base/ui` 的 `Attachment` 工业风套件，按 `mimeType` 动态呈现图标（PDF/Word/Excel/图片），支持原中文文件名展示、字节格式化与点击预览/原名下载。

