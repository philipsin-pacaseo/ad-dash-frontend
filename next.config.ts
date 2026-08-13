import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // 🌟 啟動企業級獨立部署模式
  // 確保 Zeabur 容器化打包完整，根絕靜態檔案 (Chunk) 遺失與 CDN 快取異常
  output: "standalone",
};

export default nextConfig;