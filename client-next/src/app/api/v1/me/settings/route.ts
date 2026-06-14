import { NextResponse, type NextRequest } from "next/server";
import { getSettings, updateSettings } from "@/lib/mock/data";
import { SESSION_COOKIE } from "@/lib/auth/session";

function currentLogin(req: NextRequest): string | undefined {
  return req.cookies.get(SESSION_COOKIE)?.value;
}

export async function GET(req: NextRequest) {
  const login = currentLogin(req);
  if (!login) return NextResponse.json({ title: "Unauthorized", status: 401 }, { status: 401 });
  return NextResponse.json(getSettings(login));
}

export async function PUT(req: NextRequest) {
  const login = currentLogin(req);
  if (!login) return NextResponse.json({ title: "Unauthorized", status: 401 }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  return NextResponse.json(updateSettings(login, { locale: body.locale ?? "zh-TW" }));
}
