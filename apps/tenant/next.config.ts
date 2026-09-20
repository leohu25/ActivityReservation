import type { NextConfig } from "next";

const customAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
  : [];

// 支持内网穿透与外网/局域网开发调试白名单
const commonAllowedOrigins = [
  "*.cpolar.cn",
  "*.cpolar.top",
  "*.ngrok-free.app",
  "*.ngrok.io",
  "*.loca.lt",
  "*.trycloudflare.com",
  ...customAllowedOrigins,
];

const nextConfig: NextConfig = {
  output: "standalone",
  // 开发模式下允许跨网络、局域网 IP 或穿透域名加载静态资源与 HMR
  allowedDevOrigins: commonAllowedOrigins,
  experimental: {
    serverActions: {
      // 预置常见穿透域名及自定义通配域名，支持环境变量 ALLOWED_ORIGINS 动态扩展
      allowedOrigins: commonAllowedOrigins,
    },
  },
  /* config options here */
};

export default nextConfig;
