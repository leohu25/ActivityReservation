"use client";

import React, { useState } from "react";
import { signIn, signUp } from "@base/auth/client";
import { useRouter } from "next/navigation";
import { toast } from "@base/ui";
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
} from "lucide-react";

/**
 * 平台控制平面超级管理员登录/注册页面组件 (FDD 自包含切片)
 * 遵循现代轻量工业数智风：极浅冷灰蓝底色、纯白浮动卡片、科技皇家蓝品牌色、全 Lucide 矢量图标
 */
function parseFriendlyErrorMessage(err: unknown): string {
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";

  // 数据库连接失败（ECONNREFUSED / P1001 / 服务宕机）
  if (
    message.includes("ECONNREFUSED") ||
    message.includes("Can't reach database server") ||
    message.includes("P1001") ||
    message.includes("database server at") ||
    message.includes("fetch failed")
  ) {
    return "无法连接数据库：请确认本地数据库容器已启动，并已在 apps/control/.env.local 配置正确的 CONTROL_DATABASE_URL。";
  }

  if (
    message.includes("Invalid login credentials") ||
    message.includes("INVALID_EMAIL_OR_PASSWORD")
  ) {
    return "登录失败：超管邮箱或密码错误。";
  }

  return message || "认证服务网络异常，请检查数据库服务状态。";
}

export function ControlLogin(): React.JSX.Element {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const showError = (msg: string) => {
      setError(msg);
      toast.error(msg);
    };

    try {
      if (isRegister) {
        const res = await signUp.email({
          email,
          password,
          name: name || email.split("@")[0],
        });
        if (res.error) {
          const msg =
            res.error.message?.includes("ECONNREFUSED") ||
            res.error.message?.includes("Can't reach database")
              ? "无法连接数据库：请确认本地数据库容器已启动且配置正确。"
              : res.error.message || "注册失败，请检查输入格式";
          showError(msg);
        } else {
          toast.success("注册成功，正在进入控制平面...");
          router.push("/workbench");
          router.refresh();
        }
      } else {
        const res = await signIn.email({
          email,
          password,
        });
        if (res.error) {
          const msg =
            res.error.message?.includes("ECONNREFUSED") ||
            res.error.message?.includes("Can't reach database")
              ? "无法连接数据库：请确认本地数据库容器已启动且配置正确。"
              : res.error.message || "登录失败，超管邮箱或密码错误";
          showError(msg);
        } else {
          toast.success("登录成功，欢迎回到控制平面");
          router.push("/workbench");
          router.refresh();
        }
      }
    } catch (err: unknown) {
      const msg = parseFriendlyErrorMessage(err);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F7FB] p-6 font-sans antialiased text-slate-900">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-10 shadow-xl">
        {/* 头部品牌与 Logo */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white font-black text-2xl shadow-md shadow-blue-500/25 ring-2 ring-blue-500/20">
            CR
          </div>
          <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">
            {isRegister ? "注册总控超级管理员" : "控制平面超级管理员登录"}
          </h2>
          <div className="mt-1.5 flex items-center justify-center gap-1 text-xs text-slate-400">
            <ShieldCheck className="size-3.5 text-blue-600" />
            <span>Control Plane Super Admin 认证中心</span>
          </div>
        </div>

        {/* 错误警告条 */}
        {error && (
          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-rose-200/80 bg-rose-50/80 p-3.5 text-xs text-rose-700">
            <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* 表单主体 */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isRegister && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                <User className="size-3.5 text-slate-400" />
                <span>超管姓名 / 备注</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：平台总架构师"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          )}

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
              <Mail className="size-3.5 text-slate-400" />
              <span>超管邮箱地址</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@qq.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <p className="mt-1.5 text-[11px] text-slate-400">
              提示：默认平台超管邮箱为{" "}
              <code className="font-mono text-blue-600 font-semibold">
                admin@qq.com
              </code>
            </p>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
              <Lock className="size-3.5 text-slate-400" />
              <span>访问密码</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>正在验证超级管理员凭证...</span>
              </>
            ) : (
              <span>
                {isRegister ? "立即注册总控管理员" : "进入控制平面大盘"}
              </span>
            )}
          </button>
        </form>

        {/* 注册/登录切换 */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            {isRegister
              ? "已有平台管理员账号？直接登录"
              : "首次部署？注册初始超级管理员账号"}
          </button>
        </div>
      </div>
    </div>
  );
}
