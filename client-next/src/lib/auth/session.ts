import "server-only";
import { cookies } from "next/headers";
import type { AuthUser } from "@/lib/types";

export const SESSION_COOKIE = "JSESSIONID";
export const MFA_PENDING_COOKIE = "eds_mfa_pending";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

/** RSC / Server Action 用：讀取目前登入使用者（Phase 3 從 Spring Boot /api/v1/auth/me 取得）。 */
export async function getServerSession(): Promise<AuthUser | null> {
  const store = await cookies();
  const jsessionid = store.get(SESSION_COOKIE)?.value;
  if (!jsessionid) return null;

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
      headers: { Cookie: `JSESSIONID=${jsessionid}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.preAuth) return null;
    return {
      id: data.id,
      loginName: data.loginName,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      enabled: data.enabled,
      twoFactorAuth: data.twoFactorAuth,
      authorities: data.authorities ?? [],
      locale: data.locale,
      lastAccess: data.lastAccess ?? 0,
    };
  } catch {
    return null;
  }
}
