import { NextResponse } from "next/server";
import { MFA_PENDING_COOKIE, SESSION_COOKIE } from "@/lib/auth/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(MFA_PENDING_COOKIE);
  return res;
}
