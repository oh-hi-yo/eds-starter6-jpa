"use client";
import { useEffect } from "react";
import { Button, Result } from "antd";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 前端錯誤回報（Phase 1：送至 mock log 端點）
    fetch("/api/v1/logs/client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: error.message, digest: error.digest, stack: error.stack }),
    }).catch(() => {});
  }, [error]);

  return (
    <Result
      status="500"
      title="500"
      subTitle="伺服器發生錯誤，請稍後再試。"
      extra={
        <Button type="primary" onClick={reset}>
          重試
        </Button>
      }
    />
  );
}
