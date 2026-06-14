import { NextResponse, type NextRequest } from "next/server";
import { findUserByLogin, toAuthUser } from "@/lib/mock/data";
import { MFA_PENDING_COOKIE, SESSION_COOKIE } from "@/lib/auth/session";

// Mock 登入：密碼 = "admin" 或等於 loginName 即通過。
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    loginName?: string;
    password?: string;
    rememberMe?: boolean;
  };
  const user = body.loginName ? findUserByLogin(body.loginName) : undefined;
  const passwordOk = user && (body.password === "admin" || body.password === user.loginName);

  if (!user || !passwordOk) {
    return NextResponse.json(
      { title: "Bad credentials", status: 401, detail: "登入名稱或密碼錯誤" },
      { status: 401 },
    );
  }
  if (!user.enabled) {
    return NextResponse.json(
      { title: "Account disabled", status: 403, detail: "帳號已停用" },
      { status: 403 },
    );
  }
  if (user.lockedUntil && user.lockedUntil > Date.now()) {
    return NextResponse.json(
      { title: "Account locked", status: 423, detail: "帳號已鎖定，請稍後再試" },
      { status: 423 },
    );
  }

  if (user.twoFactorAuth) {
    const res = NextResponse.json({ mfaRequired: true });
    res.cookies.set(MFA_PENDING_COOKIE, user.loginName, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return res;
  }

  const res = NextResponse.json({ mfaRequired: false, user: toAuthUser(user) });
  res.cookies.set(SESSION_COOKIE, user.loginName, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
