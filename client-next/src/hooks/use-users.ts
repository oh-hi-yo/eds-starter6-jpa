"use client";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { PageResult, UserRow } from "@/lib/types";
import type { UserInput } from "@/lib/schemas/user.schema";

export interface UsersParams {
  page: number;
  size: number;
  q?: string;
}

export function useUsers(params: UsersParams) {
  const qs = new URLSearchParams({
    page: String(params.page),
    size: String(params.size),
    ...(params.q ? { q: params.q } : {}),
  });
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => apiFetch<PageResult<UserRow>>(`/api/v1/users?${qs.toString()}`),
    placeholderData: keepPreviousData,
  });
}

export function useAuthorities() {
  return useQuery({
    queryKey: ["authorities"],
    queryFn: () => apiFetch<string[]>("/api/v1/authorities"),
    staleTime: Infinity,
  });
}

export function useUpsertUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UserInput) => {
      const isUpdate = input.id != null;
      return apiFetch<UserRow>(isUpdate ? `/api/v1/users/${input.id}` : "/api/v1/users", {
        method: isUpdate ? "PUT" : "POST",
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/v1/users/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUnlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<UserRow>(`/api/v1/users/${id}/unlock`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDisableUserTwoFactor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<UserRow>(`/api/v1/users/${id}/two-factor-disable`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useSendResetEmail() {
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<{ ok: boolean; message: string }>(`/api/v1/users/${id}/password-reset-email`, {
        method: "POST",
      }),
  });
}
