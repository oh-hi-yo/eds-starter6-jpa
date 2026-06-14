import { NextResponse, type NextRequest } from "next/server";
import { revokeDevice } from "@/lib/mock/data";
import { SESSION_COOKIE } from "@/lib/auth/session";

type Ctx = { params: Promise<{ series: string }> };

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const login = req.cookies.get(SESSION_COOKIE)?.value;
  if (!login) return NextResponse.json({ title: "Unauthorized", status: 401 }, { status: 401 });
  const { series } = await params;
  revokeDevice(login, series);
  return new NextResponse(null, { status: 204 });
}
