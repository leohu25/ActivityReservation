/**
 * @fileoverview 架构红线与代码防腐核心规则配置
 *
 * 包含：
 * 1. 语法级与全局 API 禁手 (no-restricted-globals, no-restricted-syntax)
 * 2. 模块穿透防护 (no-restricted-imports)
 * 3. 租户端与管控端通用的防腐规则
 */

export const architectureRedlineRules = {
  // 1. 严禁浏览器原生 confirm() / alert() 弹窗
  "no-restricted-globals": [
    "error",
    {
      name: "confirm",
      message:
        "【架构红线】严禁调用浏览器原生 confirm(...) 弹窗。破坏性操作统一由 @base/ui 的 ConfirmDialog 提示一次。",
    },
    {
      name: "alert",
      message:
        "【架构红线】严禁调用浏览器原生 alert(...)。请使用 @base/ui 提供的 Toast 通知或 Modal 对话框。",
    },
  ],

  // 2. 严禁页面强刷与直接访问私有连接
  "no-restricted-syntax": [
    "error",
    {
      selector:
        "CallExpression[callee.object.property.name='location'][callee.property.name='reload'], CallExpression[callee.object.name='location'][callee.property.name='reload']",
      message:
        "【架构红线】严禁在业务代码中调用 location.reload() 强刷页面。页面状态变更必须由 React 状态驱动或调用 router.refresh()。",
    },
    {
      selector:
        "MemberExpression[object.object.name='process'][object.property.name='env'][property.name='DATABASE_URL']",
      message:
        "【架构红线】严禁业务代码直连 process.env.DATABASE_URL。必须通过 TenantDbManager 或 TenantContext 获取动态隔离连接。",
    },
    {
      selector:
        "BinaryExpression[left.name='status'][operator=/^(===|!==)$/][right.value=/^(ACTIVE|DISABLED)$/], BinaryExpression[right.name='status'][operator=/^(===|!==)$/][left.value=/^(ACTIVE|DISABLED)$/]",
      message:
        '【架构红线】严禁在业务逻辑中裸写主数据启停状态魔法值 ("ACTIVE" / "DISABLED")。必须使用 @base/shared 导出的 MasterDataStatus.ACTIVE / DISABLED 常量对象契约。',
    },
  ],

  // 3. 严禁穿透工作区内部源码目录
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: ["@base/*/src/*"],
          message:
            "【架构红线】严禁通过 /src/ 穿透工作区包内部实现；必须使用 package.json exports 声明的公共入口。",
        },
      ],
    },
  ],
};
