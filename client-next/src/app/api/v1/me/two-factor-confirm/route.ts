import { NextResponse, type NextRequest } from "next/server";
import { findUserByLogin, toAuthUser } from "@/lib/mock/data";
import { SESSION_COOKIE } from "@/lib/auth/session";

// Mock：OTP 固定 "123456" 通過，啟用 2FA。
export async function POST(req: NextRequest) {
  const login = req.cookies.get(SESSION_COOKIE)?.value;
  const user = login ? findUserByLogin(login) : undefined;
  if (!user) return NextResponse.json({ title: "Unauthorized", status: 401 }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { otp?: string };
  if (body.otp !== "123456") {
    return NextResponse.json({ title: "Invalid code", status: 401, detail: "驗證碼錯誤" }, { status: 401 });
  }
  user.twoFactorAuth = true;
  return NextResponse.json(toAuthUser(user));
}
