"use client";

import React, { useState } from "react";
import { signIn, signUp, authClient } from "@chenrun/auth/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Button,
} from "@chenrun/ui";
import { ArrowLeft, Loader2, Building2, ChevronRight } from "lucide-react";

interface OrgItem {
  id: string;
  name: string;
  slug: string;
}

/**
 * 登录与注册独立路由页面 (遵循现代轻量数智风与多租户按需选择进入模式)
 */
export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 多租户选择状态
  const [candidateOrgs, setCandidateOrgs] = useState<OrgItem[] | null>(null);
  const [activatingOrgId, setActivatingOrgId] = useState<string | null>(null);

  /**
   * 激活选定的租户并进入 ERP 工作台
   */
  const handleSelectAndEnter = async (orgId: string) => {
    setActivatingOrgId(orgId);
    setError(null);
    try {
      await authClient.organization.setActive({
        organizationId: orgId,
      });
      router.push("/workbench");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "激活租户失败，请重试");
      setActivatingOrgId(null);
    }
  };

  /**
   * 提交登录或注册表单
   */
  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await signUp.email({
          email,
          password,
          name: name || email.split("@")[0],
        });
        if (res.error) {
          setError(res.error.message || "注册失败，请检查填写内容");
          setLoading(false);
          return;
        }
      } else {
        const res = await signIn.email({
          email,
          password,
        });
        if (res.error) {
          setError(res.error.message || "登录失败，账号或密码错误");
          setLoading(false);
          return;
        }
      }

      // 登录/注册成功后，主动拉取名下企业租户列表
      const orgsRes = await authClient.organization.list();
      // SAFETY: Better Auth organization.list() 返回的列表项符合 OrgItem 接口契约
      const orgList = ((orgsRes?.data ?? []) as unknown as OrgItem[]) || [];

      if (orgList.length === 1 && orgList[0]?.id) {
        // 1. 只有唯一定点租户：直接静默激活进入，0 多余交互
        await authClient.organization.setActive({
          organizationId: orgList[0].id,
        });
        router.push("/workbench");
      } else if (orgList.length > 1) {
        // 2. 属于多个企业：弹出企业选择面板让用户明确选择进入哪个租户
        setCandidateOrgs(orgList);
        setLoading(false);
      } else {
        // 3. 尚未加入任何企业
        router.push("/workbench");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "请求失败，请稍后重试");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F7FB] p-6 dark:bg-slate-950 font-sans">
      <Card className="w-full max-w-md border-slate-200/80 bg-white py-6 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none animate-in fade-in zoom-in-95 duration-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white font-black text-lg shadow-md shadow-blue-500/25 ring-1 ring-blue-500/20">
            CR
          </div>
          <CardTitle className="mt-3 text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {candidateOrgs
              ? "选择进入的企业空间"
              : isRegister
                ? "注册企业新账号"
                : "宸润数智 ERP 租户登录"}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            {candidateOrgs
              ? `检测到您关联了 ${candidateOrgs.length} 家企业租户，请点击选择本次要进入的企业：`
              : "全链路数字化供应链与精益制造统一入口"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-600 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60">
              {error}
            </div>
          )}

          {candidateOrgs ? (
            /* 多租户选择卡片列表 */
            <div className="space-y-3">
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {candidateOrgs.map((org) => {
                  const isCurrentActivating = activatingOrgId === org.id;
                  return (
                    <button
                      key={org.id}
                      type="button"
                      disabled={Boolean(activatingOrgId)}
                      onClick={() => handleSelectAndEnter(org.id)}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-blue-500 hover:bg-blue-50/40 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition-all text-left group cursor-pointer shadow-xs disabled:opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 group-hover:scale-105 transition-transform">
                          <Building2 className="size-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {org.name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            标识编码: {org.slug}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-blue-600">
                        {isCurrentActivating ? (
                          <Loader2 className="size-4 animate-spin text-blue-600" />
                        ) : (
                          <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCandidateOrgs(null)}
                  disabled={Boolean(activatingOrgId)}
                  className="text-xs text-slate-500"
                >
                  <ArrowLeft className="size-3.5 mr-1" />
                  返回重新登录
                </Button>
                <span className="text-[11px] text-slate-400">
                  支持 Database-per-Tenant 隔离
                </span>
              </div>
            </div>
          ) : (
            /* 标准登录/注册表单 */
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    用户姓名 / 称谓
                  </label>
                  <Input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例如：王建国"
                    className="rounded-lg"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  企业工作邮箱
                </label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@chenrun.com"
                  className="rounded-lg font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  账户登录密码
                </label>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-lg"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-lg font-bold shadow-md shadow-blue-600/20 cursor-pointer"
              >
                {loading && <Loader2 className="size-4 animate-spin mr-1" />}
                <span>
                  {loading
                    ? "验证安全凭据..."
                    : isRegister
                      ? "立即完成注册"
                      : "安全登录系统"}
                </span>
              </Button>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError(null);
                  }}
                  className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                >
                  {isRegister
                    ? "已有企业账号？直接登录"
                    : "没有账号？注册新账号"}
                </button>
                <Link
                  href="/"
                  className="hover:text-slate-800 dark:hover:text-slate-200"
                >
                  返回首页
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
