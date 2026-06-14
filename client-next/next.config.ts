import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // beforeFiles: processed before Route Handlers, so mock routes are bypassed.
      beforeFiles: [
        {
          source: "/api/v1/:path*",
          destination: `${BACKEND_URL}/api/v1/:path*`,
        },
      ],
    };
  },
  transpilePackages: ["antd", "@ant-design/icons", "ag-grid-react", "ag-grid-community"],
};

export default nextConfig;
