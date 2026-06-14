import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Phase 1: mock API 由內部 Route Handlers (/api/v1/*) 提供。
  // Phase 3 整合時改為 rewrite 至真實 Spring Boot：
  //   async rewrites() {
  //     return [{ source: "/api/v1/:path*", destination: "http://localhost:8080/api/v1/:path*" }];
  //   },
  transpilePackages: ["antd", "@ant-design/icons", "ag-grid-react", "ag-grid-community"],
};

export default nextConfig;
