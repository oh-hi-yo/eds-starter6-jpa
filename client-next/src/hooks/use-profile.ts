"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { AuthUser, Device, UserSettings } from "@/lib/types";

export function useSettings() {
  return useQuery({
    queryKey: ["me", "settings"],
    queryFn: () => apiFetch<UserSettings>("/api/v1/me/settings"),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: UserSettings) =>
      apiFetch<UserSettings>("/api/v1/me/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me", "settings"] }),
  });
}

export function useDevices() {
  return useQuery({
    queryKey: ["me", "devices"],
    queryFn: () => apiFetch<Device[]>("/api/v1/me/devices"),
  });
}

export function useRevokeDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (series: string) =>
      apiFetch<void>(`/api/v1/me/devices/${series}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me", "devices"] }),
  });
}

export function useEnableTwoFactor() {
  return useMutation({
    mutationFn: () =>
      apiFetch<{ otpauthUri: string }>("/api/v1/me/two-factor-enable", { method: "POST" }),
  });
}

export function useConfirmTwoFactor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (otp: string) =>
      apiFetch<AuthUser>("/api/v1/me/two-factor-confirm", {
        method: "POST",
        body: JSON.stringify({ otp }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth", "me"] }),
  });
}

export function useDisableTwoFactorSelf() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<AuthUser>("/api/v1/me/two-factor-disable", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth", "me"] }),
  });
}
