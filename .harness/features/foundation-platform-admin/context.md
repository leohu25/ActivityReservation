# 特性背景：平台运营商总控面板与租户开通中心 (foundation-platform-admin)

## 一、 目标

提供平台运营商级别的独立管理视图（Platform Super Admin），支持平台总管理员统一查看管理所有租户、开通新租户并触发物理数据库自动化 Provisioning、初始化分配租户管理员账号与全生命周期状态管控。

## 二、 范围内能力

1. 平台管理员独立认证与总控大盘。
2. 租户开通工作流：输入租户名称、标识与初始管理员邮箱，自动调用 `foundation-migration` 引擎创建物理库（Database-per-Tenant）。
3. 租户列表与状态运维管控（ACTIVE / SUSPENDED）。

## 三、 明确不做

- 租户内部的细粒度业务角色分配（交由 `foundation-tenant-rbac-ui`）。
- 具体采购订单业务（交由 `procurement-center`）。
