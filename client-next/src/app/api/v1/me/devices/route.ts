import { NextResponse, type NextRequest } from "next/server";
import { listDevices } from "@/lib/mock/data";
import { SESSION_COOKIE } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const login = req.cookies.get(SESSION_COOKIE)?.value;
  if (!login) return NextResponse.json({ title: "Unauthorized", status: 401 }, { status: 401 });
  return NextResponse.json(listDevices(login));
}
