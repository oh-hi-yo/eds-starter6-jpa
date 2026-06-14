import { NextResponse, type NextRequest } from "next/server";
import { findUserByLogin, toAuthUser } from "@/lib/mock/data";
import { MFA_PENDING_COOKIE, SESSION_COOKIE } from "@/lib/auth/session";

// Mock 2FA：正確驗證碼固定為 "123456"。
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { otp?: string };
  const pending = req.cookies.get(MFA_PENDING_COOKIE)?.value;

  if (!pending) {
    return NextResponse.json(
      { title: "No MFA session", status: 403, detail: "找不到 2FA 登入流程" },
      { status: 403 },
    );
  }
  if (body.otp !== "123456") {
    return NextResponse.json(
      { title: "Invalid code", status: 401, detail: "驗證碼錯誤" },
      { status: 401 },
    );
  }
  const user = findUserByLogin(pending);
  if (!user) {
    return NextResponse.json({ title: "Not found", status: 404 }, { status: 404 });
  }

  const res = NextResponse.json({ user: toAuthUser(user) });
  res.cookies.set(SESSION_COOKIE, user.loginName, { httpOnly: true, sameSite: "lax", path: "/" });
  res.cookies.delete(MFA_PENDING_COOKIE);
  return res;
}
