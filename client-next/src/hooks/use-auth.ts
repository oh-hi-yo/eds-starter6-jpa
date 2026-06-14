"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { AuthUser } from "@/lib/types";

export function useAuthUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiFetch<AuthUser>("/api/v1/auth/me"),
    retry: false,
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (input: { loginName: string; password: string; rememberMe?: boolean }) =>
      apiFetch<{ mfaRequired: boolean; user?: AuthUser }>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useVerify2fa() {
  return useMutation({
    mutationFn: (otp: string) =>
      apiFetch<{ user: AuthUser }>("/api/v1/auth/2fa", {
        method: "POST",
        body: JSON.stringify({ otp }),
      }),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>("/api/v1/auth/logout", { method: "POST" }),
    onSuccess: () => qc.clear(),
  });
}
