# 宸润数智 ERP 技术文档中心 (Documentation Center)

欢迎查阅宸润数智 ERP 系统工程与架构文档资产库。

为了保持工程文档的清晰性与防腐治理，所有文档均已按照领域职责进行结构化收敛。

---

## 快速导航入口

- **系统核心总览**：请直接阅读根目录的 **[《系统整体架构白皮书》(`docs/ARCHITECTURE.md`)](./ARCHITECTURE.md)**，该文档为系统的架构总纲与全局导航中枢。

---

## 文档目录结构与领域索引

```text
docs/
├── ARCHITECTURE.md                  # 【架构总纲】系统架构白皮书与全景导航索引 (SSoT)
├── README.md                        # 【文档中心】本文件，目录与索引说明
├── permissions/                     # 【权限体系】细粒度权限模型、全链路闭环与字段策略
│   ├── permission-architecture-deep-dive.md                   # 权限系统全链路架构与原理解析
│   └── Field_Level_Permission_Architecture_and_Implementation.md # 字段级权限架构与工程实施规范
├── architecture/                    # 【核心架构】多租户 SaaS 基础设施、迁移演进与切片规范
│   ├── saas-multitenant-architecture.md                       # 多租户 SaaS 架构与隔离机制
│   ├── database-migration-engine.md                           # 数据库自愈与演进引擎架构解析
│   ├── fdd-vertical-slice-architecture.md                     # Feature-based Vertical Slice 架构（历史文件名）
│   └── Feature_Manifest_and_Dynamic_Discovery_Architecture.md # 特性清单与构建期动态自发现规范
├── deployment/                      # 【生产运维】部署拓扑、Docker 容器化与运维实战
│   └── DEPLOYMENT.md                # 生产与多环境部署实战指南
├── collaboration/                   # 【工程协同】团队与多智能体协作机制
│   ├── agent-development-workflow.md                          # 智能体全生命周期开发工作流指南 (SOP)
│   ├── harness-collaboration-guide.md                         # Harness 协同指南
│   └── scripts-reference.md                                   # 根 package.json 全量命令参考手册 (SSoT)
├── phases/                          # 【阶段交付方案】各里程碑业务闭环、建表设计与研发拆解
│   └── phase-1/                     # 中央厨房 ERP 第一版（Phase 1 / MVP）交付方案
└── archive/                         # 【历史归档】已完成阶段性使命的初期 PRD 与闭环设计底座
    ├── README.md                    # 归档背景与现行架构映射说明
    ├── SaaS Foundation 权限基础设施工程实施规格.md
    ├── SaaS Foundation 权限系统完整设计方案.md
    ├── SaaS Tenant 全生命周期与用户、员工、组织、权限闭环设计.md
    └── SaaS 租户后台产品结构与组织权限模型定义.md
```

---

## 智能体协作与规范阅读提示 (For AI Agents & Developers)

1. **零代码膨胀原则**：日常业务开发请先阅读根目录 `AGENTS.md` 确定当前特性的上下文与白名单范围；
2. **渐进式加载**：当涉及权限设计、多租户连接池修改、数据库增量迁移或新切片接入时，按需调阅对应子目录下的专项深度技术文档，避免向上下文注入冗余信息。
