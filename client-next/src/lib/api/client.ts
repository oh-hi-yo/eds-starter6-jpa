"use client";
import type { ProblemDetail } from "@/lib/types";

export class ApiError extends Error {
  constructor(
    public readonly problem: ProblemDetail,
    public readonly status: number,
  ) {
    super(problem.detail ?? problem.title);
    this.name = "ApiError";
  }
}

/**
 * Client-side fetch wrapper：
 * - 成功回傳解析後 JSON
 * - 失敗解析 RFC 7807 ProblemDetail 並擲出 ApiError
 */
export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "same-origin",
  });

  if (!res.ok) {
    let problem: ProblemDetail = { title: res.statusText, status: res.status };
    try {
      problem = (await res.json()) as ProblemDetail;
    } catch {
      /* 非 JSON 錯誤，保留預設 */
    }
    throw new ApiError(problem, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
