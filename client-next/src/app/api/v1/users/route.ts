import { NextResponse, type NextRequest } from "next/server";
import { listUsers, upsertUser } from "@/lib/mock/data";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const page = Number(sp.get("page") ?? "0");
  const size = Number(sp.get("size") ?? "20");
  const q = sp.get("q") ?? undefined;
  return NextResponse.json(listUsers(page, size, q));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const created = upsertUser({ ...body, id: null });
  return NextResponse.json(created, { status: 201 });
}
