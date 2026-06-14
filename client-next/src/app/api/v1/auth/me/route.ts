import { NextResponse, type NextRequest } from "next/server";
import { findUserByLogin, toAuthUser } from "@/lib/mock/data";
import { SESSION_COOKIE } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const login = req.cookies.get(SESSION_COOKIE)?.value;
  const user = login ? findUserByLogin(login) : undefined;
  if (!user) {
    return NextResponse.json({ title: "Unauthorized", status: 401 }, { status: 401 });
  }
  return NextResponse.json(toAuthUser(user));
}
