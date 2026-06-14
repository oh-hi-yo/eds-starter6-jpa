import { NextResponse, type NextRequest } from "next/server";
import { findUserByLogin } from "@/lib/mock/data";
import { SESSION_COOKIE } from "@/lib/auth/session";

// Mock：回傳 otpauth URI 供 QRCode 渲染（secret 不入 log）。
export async function POST(req: NextRequest) {
  const login = req.cookies.get(SESSION_COOKIE)?.value;
  const user = login ? findUserByLogin(login) : undefined;
  if (!user) return NextResponse.json({ title: "Unauthorized", status: 401 }, { status: 401 });
  const secret = "JBSWY3DPEHPK3PXP";
  const otpauthUri = `otpauth://totp/EDS:${user.loginName}?secret=${secret}&issuer=EDS`;
  return NextResponse.json({ otpauthUri });
}
