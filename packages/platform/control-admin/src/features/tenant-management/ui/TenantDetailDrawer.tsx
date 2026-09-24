"use client";

import React, { useState } from "react";
import type { ControlTenantDetail, ControlTenantMember } from "../types";
import {
  X,
  Database,
  Building2,
  Users,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Copy,
  Check,
  Sparkles,
  Search,
  KeyRound,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardContent,
  Badge,
  Button,
  FormModal,
  toast,
  z,
} from "@base/ui";
import { resetTenantUserPasswordAction } from "../actions";

export interface TenantDetailDrawerProps {
  /** 抽屉是否显示 */
  readonly isOpen: boolean;
  /** 租户详情数据（加载中为 null） */
  readonly tenantDetail: ControlTenantDetail | null;
  /** 是否正在加载详情 */
  readonly isLoading: boolean;
  /** 关闭抽屉回调 */
  readonly onClose: () => void;
  /** 搜索与换页重新拉取数据回调 */
  readonly onFetchMembers: (page: number, search: string) => void;
}

/**
 * 租户全景详情抽屉组件 (TenantDetailDrawer)
 * 完全基于 shadcn ui (Card, Badge, Button, FormDialog) 组合构建，自适应暗色/亮色主题
 */
export function TenantDetailDrawer({
  isOpen,
  tenantDetail,
  isLoading,
  onClose,
  onFetchMembers,
}: TenantDetailDrawerProps): React.JSX.Element | null {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");

  // 重置密码 Modal 状态
  const [resetTargetUser, setResetTargetUser] =
    useState<ControlTenantMember | null>(null);
  const [customPassword, setCustomPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessData, setResetSuccessData] = useState<{
    email: string;
    temporaryPassword: string;
  } | null>(null);
  const [copiedPwd, setCopiedPwd] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, tag: string) => {
    navigator.clipboard.writeText(text);
    if (tag === "pwd") {
      setCopiedPwd(true);
      setTimeout(() => setCopiedPwd(false), 2000);
    } else {
      setCopiedEmail(tag);
      setTimeout(() => {
        setCopiedEmail((prev) => (prev === tag ? null : prev));
      }, 2000);
    }
  };

  const handleSearchSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onFetchMembers(1, searchInput.trim());
  };

  const handlePageChange = (newPage: number) => {
    onFetchMembers(newPage, searchInput.trim());
  };

  const handleOpenResetModal = (member: ControlTenantMember) => {
    setResetTargetUser(member);
    setCustomPassword("");
    setResetSuccessData(null);
    setCopiedPwd(false);
  };

  const handleConfirmReset = async () => {
    if (!tenantDetail || !resetTargetUser) return;
    setIsResetting(true);
    try {
      const res = await resetTenantUserPasswordAction(
        tenantDetail.id,
        resetTargetUser.userId,
        customPassword.trim() || undefined,
      );
      if (res.success && res.data) {
        setResetSuccessData(res.data);
        toast.success(`成员 [${res.data.email}] 密码重置成功！`);
      } else if (!res.success) {
        toast.error(res.error || "重置密码失败");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "重置密码异常");
    } finally {
      setIsResetting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === "owner") {
      return (
        <Badge
          variant="outline"
          className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 text-[11px] font-bold"
        >
          <Sparkles className="size-3" />
          初始拥有者 / Owner
        </Badge>
      );
    }
    if (role === "admin") {
      return (
        <Badge
          variant="outline"
          className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 gap-1 text-[11px] font-bold"
        >
          <Shield className="size-3" />
          管理员 / Admin
        </Badge>
      );
    }
    if (role === "member") {
      return (
        <Badge
          variant="outline"
          className="border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400 text-[11px] font-medium"
        >
          标准成员 / Member
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-[11px] font-mono capitalize">
        {role}
      </Badge>
    );
  };

  const db = tenantDetail?.database;
  const dbStatus = db?.status ?? "PROVISIONING";
  const pagination = tenantDetail?.memberPagination ?? {
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in">
      <div
        className="fixed inset-0 cursor-default"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 侧边抽屉容器 */}
      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col bg-card shadow-2xl border-l border-border animate-in slide-in-from-right duration-200">
        {/* 顶部 Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4.5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Building2 className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">
                  {tenantDetail ? tenantDetail.name : "加载中..."}
                </h2>
                {tenantDetail && (
                  <Badge variant="secondary" className="font-mono text-xs">
                    {tenantDetail.slug}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                租户独立物理数据库架构与全量组织成员概览
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="cursor-pointer"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading && !tenantDetail ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
              <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-xs font-medium">正在读取租户详情与拓扑...</p>
            </div>
          ) : tenantDetail ? (
            <>
              {/* 板块 1: 物理数据库与架构拓扑 (Card) */}
              <Card className="bg-muted/30 border">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                    <Database className="size-4 text-blue-600 dark:text-blue-400" />
                    <span>PostgreSQL 独立物理数据库 (Database-per-Tenant)</span>
                  </div>
                  {dbStatus === "ACTIVE" ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 text-[11px] font-bold"
                    >
                      <CheckCircle2 className="size-3" />
                      运行正常 (ACTIVE)
                    </Badge>
                  ) : dbStatus === "SUSPENDED" ? (
                    <Badge
                      variant="outline"
                      className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 text-[11px] font-bold"
                    >
                      <Clock className="size-3" />
                      已挂起 (SUSPENDED)
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-destructive/30 bg-destructive/10 text-destructive gap-1 text-[11px] font-bold"
                    >
                      <AlertTriangle className="size-3" />
                      {dbStatus}
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg bg-card p-2.5 border shadow-2xs">
                      <span className="text-[10px] text-muted-foreground block font-medium">
                        物理数据库名称
                      </span>
                      <span className="text-xs font-mono font-bold text-foreground break-all mt-0.5 block">
                        {db?.databaseName ?? "未配置"}
                      </span>
                    </div>

                    <div className="rounded-lg bg-card p-2.5 border shadow-2xs">
                      <span className="text-[10px] text-muted-foreground block font-medium">
                        部署集群 (Cluster)
                      </span>
                      <span className="text-xs font-mono font-semibold text-foreground mt-0.5 block">
                        {db?.clusterCode ?? "primary"}
                      </span>
                    </div>

                    <div className="rounded-lg bg-card p-2.5 border shadow-2xs">
                      <span className="text-[10px] text-muted-foreground block font-medium">
                        Schema 迁移版本
                      </span>
                      <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 mt-0.5 block">
                        {db?.schemaVersion ?? "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t">
                    <span>
                      租户创建时间:{" "}
                      {new Date(tenantDetail.createdAt).toLocaleString("zh-CN")}
                    </span>
                    <span>隔离范式: 物理库强隔离</span>
                  </div>
                </CardContent>
              </Card>

              {/* 板块 2: 租户组织成员清单与搜索过滤 */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-sm font-bold text-foreground">
                      组织成员与管理员清单
                    </h3>
                    <Badge
                      variant="secondary"
                      className="text-[11px] font-bold"
                    >
                      共 {pagination.total} 人
                    </Badge>
                  </div>

                  {/* 搜索过滤输入框 */}
                  <form
                    onSubmit={handleSearchSubmit}
                    className="relative flex items-center"
                  >
                    <Search className="size-3.5 text-muted-foreground absolute left-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="搜索姓名 / 邮箱 / 角色..."
                      className="w-full sm:w-56 rounded-xl border border-border bg-muted/40 pl-8 pr-7 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary focus:outline-hidden transition-all"
                    />
                    {searchInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchInput("");
                          onFetchMembers(1, "");
                        }}
                        className="absolute right-2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </form>
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center py-12 text-muted-foreground text-xs">
                    <Loader2 className="size-4 animate-spin mr-2" />
                    刷新成员数据中...
                  </div>
                ) : tenantDetail.members.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-8 text-center text-xs text-muted-foreground">
                    未找到匹配的成员记录
                  </div>
                ) : (
                  <div className="divide-y rounded-xl border bg-card overflow-hidden shadow-2xs">
                    {tenantDetail.members.map((member) => {
                      const isOwner = member.role === "owner";
                      const isCopied = copiedEmail === member.email;

                      return (
                        <div
                          key={member.id}
                          className={`p-3.5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isOwner
                              ? "bg-amber-500/5 hover:bg-amber-500/10"
                              : "hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex size-9 items-center justify-center rounded-xl font-bold text-xs shrink-0 ${
                                isOwner
                                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                                  : "bg-muted text-muted-foreground border border-border"
                              }`}
                            >
                              {member.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-foreground">
                                  {member.name}
                                </span>
                                {getRoleBadge(member.role)}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-mono text-xs text-muted-foreground">
                                  {member.email}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyToClipboard(member.email, member.email)
                                  }
                                  title="复制邮箱"
                                  className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded cursor-pointer"
                                >
                                  {isCopied ? (
                                    <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                                  ) : (
                                    <Copy className="size-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                            <div className="text-right">
                              <span className="text-[10px] text-muted-foreground block">
                                加入时间
                              </span>
                              <span className="text-xs font-mono text-foreground block">
                                {new Date(member.createdAt).toLocaleDateString(
                                  "zh-CN",
                                )}
                              </span>
                            </div>

                            {/* 超管重置密码快捷入口 */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenResetModal(member)}
                              className="gap-1 text-xs font-semibold cursor-pointer"
                              title="重置登录密码"
                            >
                              <KeyRound className="size-3.5 text-muted-foreground" />
                              <span>重置密码</span>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 分页控制条 */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2 px-1 text-xs text-muted-foreground">
                    <span>
                      第 {pagination.page} / {pagination.totalPages} 页 (共{" "}
                      {pagination.total} 条)
                    </span>
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        size="icon-xs"
                        variant="outline"
                        disabled={pagination.page <= 1 || isLoading}
                        onClick={() => handlePageChange(pagination.page - 1)}
                        className="cursor-pointer"
                      >
                        <ChevronLeft className="size-3.5" />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="outline"
                        disabled={
                          pagination.page >= pagination.totalPages || isLoading
                        }
                        onClick={() => handlePageChange(pagination.page + 1)}
                        className="cursor-pointer"
                      >
                        <ChevronRight className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-muted-foreground text-xs">
              未能获取到租户数据
            </div>
          )}
        </div>

        {/* 底部操作区 */}
        <div className="border-t border-border px-6 py-3.5 bg-muted/20 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="cursor-pointer"
          >
            关闭详情
          </Button>
        </div>
      </div>

      {/* 重置密码弹窗 (FormModal) */}
      {resetTargetUser && (
        <FormModal
          open
          onClose={() => setResetTargetUser(null)}
          mode="create"
          schema={z.object({})}
          initialValues={{}}
          title={
            resetSuccessData ? "重置成功 — 请复制新密码" : "重置成员登录密码"
          }
          description={
            resetSuccessData
              ? "临时密码已生成并生效，关闭后将无法再次查看明文，请及时同步给用户。"
              : `正在为租户 [${tenantDetail?.name}] 的成员 [${resetTargetUser.name} (${resetTargetUser.email})] 重设密码。`
          }
          submitText={
            resetSuccessData
              ? "已完成并关闭"
              : isResetting
                ? "重置中..."
                : "确认重置密码"
          }
          onSubmit={async () => {
            if (resetSuccessData) {
              setResetTargetUser(null);
              return;
            }
            await handleConfirmReset();
          }}
        >
          {resetSuccessData ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="size-4" />
                <span>新密码凭据已就绪</span>
              </div>
              <div className="rounded-lg bg-card p-3 border flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground block font-mono">
                    账号: {resetSuccessData.email}
                  </span>
                  <span className="text-sm font-mono font-bold text-foreground mt-0.5 block tracking-wider">
                    {resetSuccessData.temporaryPassword}
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() =>
                    copyToClipboard(resetSuccessData.temporaryPassword, "pwd")
                  }
                  className="gap-1 text-xs font-bold cursor-pointer"
                >
                  {copiedPwd ? (
                    <>
                      <Check className="size-3.5" />
                      <span>已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>复制密码</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label htmlFor="custom-password-input" className="block text-xs font-bold text-foreground">
                指定新密码 (可选，留空则自动生成安全临时密码)
              </label>
              <input
                id="custom-password-input"
                type="text"
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                placeholder="例如: CustomPass2026! (留空自动生成)"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:border-primary focus:outline-hidden"
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                提示：控制平面超管具有最高应急重设权限，重置后该用户需使用新密码登录租户端。
              </p>
            </div>
          )}
        </FormModal>
      )}
    </div>
  );
}
