import "server-only";
import { cookies } from "next/headers";
import { findUserByLogin, toAuthUser } from "@/lib/mock/data";
import type { AuthUser } from "@/lib/types";

export const SESSION_COOKIE = "eds_session";
export const MFA_PENDING_COOKIE = "eds_mfa_pending";

/** RSC / Server Action 用：讀取目前登入使用者（Phase 1 從 mock 解析）。 */
export async function getServerSession(): Promise<AuthUser | null> {
  const store = await cookies();
  const loginName = store.get(SESSION_COOKIE)?.value;
  if (!loginName) return null;
  const user = findUserByLogin(loginName);
  return user ? toAuthUser(user) : null;
}
